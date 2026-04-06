import { Platform, View, Text, Pressable } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import colors from "../../lib/theme/colors";

const WEB_MAX_WIDTH = 900;

const tabMeta = [
  { name: "index", labelKey: "tabs.diary" },
  { name: "search", labelKey: "tabs.search" },
  { name: "wishlist", labelKey: "tabs.wishlist" },
  { name: "stats", labelKey: "tabs.stats" },
  { name: "settings", labelKey: "tabs.settings" },
] as const;

function WebNavBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.divider.DEFAULT,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: WEB_MAX_WIDTH,
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: "italic",
            color: colors.foreground,
          }}
        >
          Transient
        </Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const meta = tabMeta.find((m) => m.name === route.name);
            const label = meta ? t(meta.labelKey) : route.name;

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  if (!isFocused) navigation.navigate(route.name);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: isFocused ? colors.muted.DEFAULT : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isFocused ? "600" : "400",
                    color: isFocused ? colors.foreground : colors["icon-muted"],
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === "web";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={isWeb ? (props: BottomTabBarProps) => <WebNavBar {...props} /> : undefined}
      screenOptions={{
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors["icon-muted"],
        headerShown: !isWeb,
        sceneStyle: isWeb
          ? {
              maxWidth: WEB_MAX_WIDTH,
              width: "100%",
              marginLeft: "auto",
              marginRight: "auto",
              backgroundColor: colors.background,
            }
          : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.diary"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: t("tabs.wishlist"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t("tabs.stats"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
