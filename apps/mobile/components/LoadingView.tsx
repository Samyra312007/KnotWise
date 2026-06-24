import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/lib/theme";

export function LoadingView() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
      <ActivityIndicator color={colors.vermilion} />
    </View>
  );
}
