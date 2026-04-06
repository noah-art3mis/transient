import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, FlatList,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { searchWorks, createWork } from "../../lib/api/works";
import { getProductionsByWork, createProduction } from "../../lib/api/productions";
import { createLogEntry } from "../../lib/api/log-entries";
import { WorkWithProductionCount, Production, MediaType } from "../../lib/types";
import WorkSearchResult from "../../components/WorkSearchResult";
import ProductionRow from "../../components/ProductionRow";
import StarRating from "../../components/StarRating";
import HeartButton from "../../components/HeartButton";
import TagInput from "../../components/TagInput";

type Step = "search" | "create-work" | "create-production" | "log";

export default function NewLogEntryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    productionId?: string;
    productionTitle?: string;
    productionVenue?: string;
  }>();

  const [step, setStep] = useState<Step>(params.productionId ? "log" : "search");
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(
    params.productionId
      ? ({
          id: params.productionId,
          title_override: params.productionTitle ?? null,
          venue: params.productionVenue ?? null,
        } as Production)
      : null
  );

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkWithProductionCount[]>([]);
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [workProductions, setWorkProductions] = useState<Production[]>([]);
  const [searching, setSearching] = useState(false);

  // Create work state
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newWorkMediaType, setNewWorkMediaType] = useState<MediaType>("theatre");
  const [newWorkCreatorName, setNewWorkCreatorName] = useState("");
  const [newWorkCreatorRole, setNewWorkCreatorRole] = useState("playwright");
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  // Create production state
  const [newProdVenue, setNewProdVenue] = useState("");
  const [newProdYear, setNewProdYear] = useState(String(new Date().getFullYear()));
  const [newProdDirector, setNewProdDirector] = useState("");

  // Log form state
  const today = new Date().toISOString().split("T")[0];
  const [dateSeen, setDateSeen] = useState(today);
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchWorks(text);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }

  async function handleWorkPress(workId: string) {
    if (expandedWorkId === workId) {
      setExpandedWorkId(null);
      return;
    }
    setExpandedWorkId(workId);
    try {
      const prods = await getProductionsByWork(workId);
      setWorkProductions(prods);
    } catch (e) {
      console.error(e);
    }
  }

  function handleProductionSelect(production: Production) {
    setSelectedProduction(production);
    setStep("log");
  }

  async function handleCreateWork() {
    const creators = newWorkCreatorName.trim()
      ? [{ name: newWorkCreatorName.trim(), role: newWorkCreatorRole }]
      : [];
    try {
      const work = await createWork({
        title: newWorkTitle,
        media_type: newWorkMediaType,
        creators,
      });
      setSelectedWorkId(work.id);
      setStep("create-production");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateProduction() {
    try {
      const prod = await createProduction({
        work_id: selectedWorkId,
        venue: newProdVenue || null,
        year: newProdYear ? parseInt(newProdYear, 10) : null,
        director: newProdDirector || null,
      });
      setSelectedProduction(prod);
      setStep("log");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSave() {
    if (!session || !selectedProduction) return;
    setSaving(true);
    try {
      await createLogEntry({
        production_id: selectedProduction.id,
        user_id: session.user.id,
        date_seen: dateSeen,
        rating,
        review: review || null,
        is_private: true,
        liked,
        tags,
        is_rewatch: isRewatch,
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ---- SEARCH VIEW ----
  if (step === "search") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-white"
      >
        <View className="px-4 pt-4">
          <TextInput
            autoFocus
            value={query}
            onChangeText={handleSearch}
            placeholder="Search for a show..."
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
        </View>
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          className="px-4"
          renderItem={({ item: work }) => (
            <View>
              <WorkSearchResult
                work={work}
                onPress={() => handleWorkPress(work.id)}
                expanded={expandedWorkId === work.id}
              />
              {expandedWorkId === work.id && (
                <>
                  {workProductions.map((prod) => (
                    <ProductionRow
                      key={prod.id}
                      production={prod}
                      onPress={() => handleProductionSelect(prod)}
                    />
                  ))}
                  <Pressable
                    onPress={() => {
                      setSelectedWorkId(work.id);
                      setStep("create-production");
                    }}
                    className="py-2 pl-6"
                  >
                    <Text className="text-blue-600 text-sm">+ Add new production</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
          ListFooterComponent={
            query.length >= 2 && !searching ? (
              <Pressable
                onPress={() => {
                  setNewWorkTitle(query);
                  setStep("create-work");
                }}
                className="py-4 items-center"
              >
                <Text className="text-blue-600">Can't find it? Add new work</Text>
              </Pressable>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    );
  }

  // ---- CREATE WORK VIEW ----
  if (step === "create-work") {
    return (
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        <Text className="text-lg font-bold mb-4">Add New Work</Text>
        <Text className="text-sm font-medium text-gray-700 mb-1">Title</Text>
        <TextInput
          value={newWorkTitle}
          onChangeText={setNewWorkTitle}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />
        <Text className="text-sm font-medium text-gray-700 mb-1">Media Type</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {(["theatre", "musical", "opera", "dance", "circus", "concert", "other"] as MediaType[]).map((mt) => (
            <Pressable
              key={mt}
              onPress={() => setNewWorkMediaType(mt)}
              className={`px-3 py-1 rounded-full ${newWorkMediaType === mt ? "bg-black" : "bg-gray-200"}`}
            >
              <Text className={newWorkMediaType === mt ? "text-white" : "text-gray-700"}>{mt}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-sm font-medium text-gray-700 mb-1">Creator (optional)</Text>
        <TextInput
          value={newWorkCreatorName}
          onChangeText={setNewWorkCreatorName}
          placeholder="Name"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-2"
        />
        <TextInput
          value={newWorkCreatorRole}
          onChangeText={setNewWorkCreatorRole}
          placeholder="Role (e.g., playwright)"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />
        <View className="flex-row gap-3 mb-8">
          <Pressable onPress={() => setStep("search")} className="flex-1 py-3 rounded-lg bg-gray-200 items-center">
            <Text className="font-medium">Back</Text>
          </Pressable>
          <Pressable
            onPress={handleCreateWork}
            disabled={!newWorkTitle.trim()}
            className="flex-1 py-3 rounded-lg bg-black items-center"
          >
            <Text className="text-white font-medium">Save Work</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ---- CREATE PRODUCTION VIEW ----
  if (step === "create-production") {
    return (
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        <Text className="text-lg font-bold mb-4">Add New Production</Text>
        <Text className="text-sm font-medium text-gray-700 mb-1">Venue</Text>
        <TextInput
          value={newProdVenue}
          onChangeText={setNewProdVenue}
          placeholder="e.g., Almeida Theatre"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />
        <Text className="text-sm font-medium text-gray-700 mb-1">Year</Text>
        <TextInput
          value={newProdYear}
          onChangeText={setNewProdYear}
          keyboardType="numeric"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />
        <Text className="text-sm font-medium text-gray-700 mb-1">Director (optional)</Text>
        <TextInput
          value={newProdDirector}
          onChangeText={setNewProdDirector}
          placeholder="Director name"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />
        <Pressable onPress={handleCreateProduction} className="py-3 rounded-lg bg-black items-center mb-8">
          <Text className="text-white font-medium">Save Production</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---- LOG FORM VIEW ----
  const displayTitle = selectedProduction?.title_override ?? selectedProduction?.venue ?? "Selected production";

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <View className="mb-4 pb-4 border-b border-gray-200">
        <Text className="text-lg font-bold">{displayTitle}</Text>
        {selectedProduction?.venue && (
          <Text className="text-gray-500">{selectedProduction.venue}</Text>
        )}
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Date seen</Text>
        <TextInput value={dateSeen} onChangeText={setDateSeen} placeholder="YYYY-MM-DD" className="border border-gray-300 rounded-lg px-4 py-2" />
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Rating</Text>
        <StarRating value={rating} onChange={setRating} />
      </View>
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">Liked</Text>
        <HeartButton value={liked} onChange={setLiked} />
      </View>
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">Seen this production before?</Text>
        <Pressable
          onPress={() => setIsRewatch(!isRewatch)}
          className={`px-3 py-1 rounded-full ${isRewatch ? "bg-black" : "bg-gray-200"}`}
        >
          <Text className={isRewatch ? "text-white" : "text-gray-700"}>{isRewatch ? "Yes" : "No"}</Text>
        </Pressable>
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Review</Text>
        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder="Write your thoughts..."
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg px-4 py-2 min-h-[100px] text-base"
          textAlignVertical="top"
        />
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Tags</Text>
        <TagInput value={tags} onChange={setTags} />
      </View>
      <View className="flex-row gap-3 mb-8">
        <Pressable onPress={() => router.back()} className="flex-1 py-3 rounded-lg bg-gray-200 items-center">
          <Text className="font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-lg bg-black items-center"
        >
          <Text className="text-white font-medium">{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
