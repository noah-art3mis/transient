import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../lib/theme/colors";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export default function TagInput({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  function handleChangeText(input: string) {
    if (input.includes(",")) {
      const tag = input.replace(",", "").trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setText("");
    } else {
      setText(input);
    }
  }

  function handleSubmitEditing() {
    const tag = text.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setText("");
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {value.map((tag, index) => (
          <View key={tag} className="flex-row items-center bg-secondary rounded-full px-3 py-1">
            <Text className="text-sm mr-1">{tag}</Text>
            <Pressable onPress={() => removeTag(index)} testID="remove-tag">
              <Ionicons name="close-circle" size={16} color={colors.muted.foreground} />
            </Pressable>
          </View>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        placeholder={t("logForm.tagsPlaceholder")}
        className="border border-input rounded-lg px-4 py-2"
      />
    </View>
  );
}
