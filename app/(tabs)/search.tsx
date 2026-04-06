import { useState } from "react";
import { View, TextInput, FlatList, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { searchWorks } from "../../lib/api/works";
import { getProductionsByWork } from "../../lib/api/productions";
import { WorkWithProductionCount, Production } from "../../lib/types";
import WorkSearchResult from "../../components/WorkSearchResult";

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkWithProductionCount[]>([]);
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [workProductions, setWorkProductions] = useState<Production[]>([]);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await searchWorks(text);
      setResults(data);
    } catch (e) {
      console.error(e);
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

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-2 pb-2">
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder={t("search.placeholder")}
          className="border border-input rounded-lg px-4 py-3 text-base"
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        className="px-4"
        renderItem={({ item: work }) => (
          <View>
            <WorkSearchResult
              work={work}
              onPress={() => handleWorkPress(work.id)}
              expanded={expandedWorkId === work.id}
            />
            {expandedWorkId === work.id &&
              workProductions.map((prod) => (
                <View key={prod.id} className="flex-row items-center">
                  <Pressable
                    onPress={() => router.push(`/production/${prod.id}`)}
                    className="flex-1 py-2 pl-6 border-b border-divider-lighter"
                  >
                    <Text className="text-sm">
                      {prod.venue ?? t("common.unknownVenue")}
                      {prod.year ? `, ${prod.year}` : ""}
                    </Text>
                    {prod.director && (
                      <Text className="text-xs text-subtle">
                        {t("common.dir")} {prod.director}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/log/new",
                        params: {
                          productionId: prod.id,
                          productionTitle: prod.title_override ?? work.title,
                          productionVenue: prod.venue ?? "",
                        },
                      })
                    }
                    className="px-3 py-1 bg-primary rounded-full mr-4"
                  >
                    <Text className="text-primary-foreground text-xs">{t("common.log")}</Text>
                  </Pressable>
                </View>
              ))}
          </View>
        )}
      />
    </View>
  );
}
