import React, { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  DemoNote,
  Eyebrow,
  Heading,
  Icon,
  Input,
  Muted,
  Page,
  ScreenHeader,
  Txt,
  styles,
} from "../src/components/ui";
import { color as c } from "../src/theme";
export default function SignIn() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [message, setMessage] = useState("");
  const pass = useRef<React.ComponentRef<typeof TextInput>>(null);
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <ScreenHeader back title="Account preview" />
      <Page style={{ paddingBottom: 40 }}>
        <View style={{ gap: 14, paddingTop: 25 }}>
          <Eyebrow>WELCOME TO TRUSTBRIDGE</Eyebrow>
          <Heading>Good decisions{"\n"}start here.</Heading>
          <Muted>
            Your workspace. Your suppliers. A clearer view before you pay.
          </Muted>
        </View>
        <View style={styles.paper}>
          <Txt style={styles.paperTitle}>Sign in</Txt>
          <Txt style={styles.mutedOnPaper}>
            Design preview only. Do not enter real credentials.
          </Txt>
          <Input
            label="Email address"
            placeholder="you@company.example"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => pass.current?.focus()}
            autoComplete="off"
          />
          <Input
            label="Password"
            placeholder="Enter a demo password"
            ref={pass}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            autoComplete="off"
            suffix={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={visible ? "Hide password" : "Show password"}
                onPress={() => setVisible((v) => !v)}
                style={{
                  minHeight: 46,
                  minWidth: 46,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon
                  name={visible ? "eye-off-outline" : "eye-outline"}
                  color={c.paperMuted}
                  size={20}
                />
              </Pressable>
            }
          />
          <Button
            title="Sign in (preview)"
            icon="arrow-forward"
            onPress={() => {
              setPassword("");
              setMessage(
                "Live sign-in is not connected. Use Explore demo below to view the frontend.",
              );
            }}
          />
          {message && (
            <Txt accessibilityRole="alert" style={styles.mutedOnPaper}>
              {message}
            </Txt>
          )}
        </View>
        <Button
          secondary
          title="Explore demo workspace"
          icon="arrow-forward"
          onPress={() => {
            setPassword("");
            router.replace("/");
          }}
        />
        <DemoNote />
      </Page>
    </SafeAreaView>
  );
}
