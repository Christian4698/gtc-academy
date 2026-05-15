// ============================================================
//  GTC ACADEMY — AIScreen.tsx (Streaming AI Chat)
// ============================================================
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius } from '../theme';
import { useUserStore, useAIStore } from '../hooks/useStore';
import { sendMessage, SUGGESTED_PROMPTS } from '../services/ai';
import { AISessionService } from '../services/supabase';
import { ChatMessage } from '../types';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface RenderMessage extends ChatMessage {
  id: string;
}

// ── BUBBLE COMPONENT ──────────────────────────────────────────────────────────
const MessageBubble = React.memo(({ msg }: { msg: RenderMessage }) => {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <LinearGradient colors={Colors.gradBlue} style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>AI</Text>
        </LinearGradient>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleBot,
      ]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
});

// ── TYPING DOTS ───────────────────────────────────────────────────────────────
const TypingDots = () => {
  const dots = [useRef(new Animated.Value(0)), useRef(new Animated.Value(0)), useRef(new Animated.Value(0))];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot.current, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot.current, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 180),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.bubbleRow}>
      <LinearGradient colors={Colors.gradBlue} style={styles.botAvatar}>
        <Text style={styles.botAvatarText}>AI</Text>
      </LinearGradient>
      <View style={styles.bubbleBot}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { opacity: dot.current }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ── SUGGESTION CHIP ───────────────────────────────────────────────────────────
const SuggestionChip = ({ text, onPress }: { text: string; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.chip}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.chipText}>{text}</Text>
  </TouchableOpacity>
);

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function AIScreen() {
  const insets   = useSafeAreaInsets();
  const { profile } = useUserStore();
  const { messages, sessionId, isStreaming, setMessages, appendMessage, updateLast, setSessionId, setStreaming } = useAIStore();

  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);
  const flatRef   = useRef<FlatList>(null);
  const inputRef  = useRef<TextInput>(null);

  // Flatten messages for FlatList with stable IDs
  const renderMessages: RenderMessage[] = messages.map((m, i) => ({
    ...m,
    id: `${m.role}-${i}`,
  }));

  // Scroll to bottom when messages change
  useEffect(() => {
    if (renderMessages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [renderMessages.length, isStreaming]);

  // ── SEND HANDLER ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isStreaming) return;

    setInputText('');
    setShowSuggestions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    // Placeholder assistant message for streaming
    const placeholderMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...newMessages, placeholderMsg]);

    try {
      // Create or reuse session in Supabase
      let sid = sessionId;
      if (!sid && profile) {
        const { data: session } = await AISessionService.createSession(profile.id, msg);
        if (session) { sid = session.id; setSessionId(session.id); }
      }

      // Stream the response
      await sendMessage(
        newMessages,
        (streamedText) => updateLast(streamedText),   // update bubble live
      );

      // Persist full conversation to Supabase
      if (sid && profile) {
        const finalMessages = useAIStore.getState().messages;
        await AISessionService.appendMessage(sid, finalMessages);
      }
    } catch (error) {
      updateLast('⚠️ Something went wrong. Please try again.');
    } finally {
      setStreaming(false);
    }
  }, [inputText, messages, isStreaming, sessionId, profile]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <LinearGradient colors={Colors.gradBlue} style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🤖</Text>
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>GTC AI Assistant</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online · Excel & Data Expert</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => {
            setMessages([]);
            setSessionId(null);
            setShowSuggestions(true);
          }}
        >
          <Text style={styles.newChatText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* ── MESSAGES ── */}
      <FlatList
        ref={flatRef}
        data={renderMessages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          showSuggestions ? (
            <View style={styles.suggestionsWrap}>
              <Text style={styles.suggestionsTitle}>
                👋 Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!{'\n'}
                What can I help you with?
              </Text>
              <Text style={styles.suggestionsLabel}>Try asking:</Text>
              <View style={styles.chips}>
                {SUGGESTED_PROMPTS.slice(0, 4).map(p => (
                  <SuggestionChip key={p} text={p} onPress={() => handleSend(p)} />
                ))}
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={isStreaming ? <TypingDots /> : null}
      />

      {/* ── INPUT BAR ── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing[2] }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          placeholder="Ask about Excel, data, dashboards..."
          placeholderTextColor={Colors.muted}
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isStreaming) && styles.sendBtnDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isStreaming}
          activeOpacity={0.8}
        >
          {isStreaming ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <LinearGradient colors={Colors.gradBlue} style={styles.sendBtnGrad}>
              <Text style={styles.sendBtnIcon}>↑</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap:             Spacing[2],
  },
  headerIcon: {
    width:        40,
    height:       40,
    borderRadius: 11,
    alignItems:   'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize:   Typography.size.base,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[1],
    marginTop:     2,
  },
  statusDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.green,
  },
  statusText: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.medium,
    color:      Colors.green,
  },
  newChatBtn: {
    backgroundColor: Colors.surface2,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical:   Spacing[1.5],
  },
  newChatText: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.bold,
    color:      Colors.dim,
  },

  // Messages
  messages: {
    padding:        Spacing[4],
    paddingBottom:  Spacing[2],
    gap:            Spacing[3],
    flexGrow:       1,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           Spacing[2],
    marginBottom:  Spacing[2],
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width:        30,
    height:       30,
    borderRadius: 15,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  botAvatarText: {
    fontSize:   9,
    fontFamily: Typography.family.black,
    color:      Colors.white,
  },
  bubble: {
    maxWidth:     '80%',
    borderRadius: Radius.lg,
    padding:      Spacing[3],
  },
  bubbleUser: {
    backgroundColor: '#0A3AFF',
    borderBottomRightRadius: Radius.sm,
  },
  bubbleBot: {
    backgroundColor: Colors.surface2,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleText: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.regular,
    color:      Colors.white,
    lineHeight: Typography.size.sm * Typography.lineHeight.relaxed,
  },
  bubbleTextUser: {
    color: Colors.white,
  },

  // Typing
  typingDots: {
    flexDirection: 'row',
    gap:           5,
    padding:       Spacing[1],
  },
  typingDot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: Colors.cyan,
  },

  // Suggestions
  suggestionsWrap: {
    marginBottom: Spacing[6],
  },
  suggestionsTitle: {
    fontSize:   Typography.size.xl,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
    lineHeight: Typography.size.xl * 1.4,
    marginBottom: Spacing[4],
  },
  suggestionsLabel: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.semiBold,
    color:      Colors.muted,
    marginBottom: Spacing[2],
    letterSpacing: Typography.letterSpacing.wide,
  },
  chips: {
    gap: Spacing[2],
  },
  chip: {
    backgroundColor: Colors.cyanBg,
    borderWidth:     1,
    borderColor:     Colors.borderCyan,
    borderRadius:    Radius.md,
    padding:         Spacing[3],
  },
  chipText: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.medium,
    color:      Colors.cyan,
  },

  // Input
  inputBar: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    gap:             Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingTop:      Spacing[2],
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex:            1,
    backgroundColor: Colors.surface2,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    color:           Colors.white,
    fontSize:        Typography.size.sm,
    fontFamily:      Typography.family.regular,
    maxHeight:       120,
  },
  sendBtn: {
    width:  44,
    height: 44,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnGrad: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sendBtnIcon: {
    fontSize:   20,
    fontFamily: Typography.family.black,
    color:      Colors.white,
  },
});
