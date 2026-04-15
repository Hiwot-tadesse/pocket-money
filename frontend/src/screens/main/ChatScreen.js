import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const SUGGESTIONS = [
  "How am I doing this month?",
  "Where am I spending the most?",
  "How can I save more money?",
  "Am I on track with my goals?",
  "Give me a savings tip",
];

const INITIAL_MESSAGE = {
  id: '0',
  role: 'assistant',
  text: "Hi! I'm your AI Finance Assistant 👋\n\nI can see your transactions, budgets, and goals. Ask me anything about your money!",
};

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const buildHistory = () =>
    messages
      .filter((m) => m.id !== '0')
      .slice(-14)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.send(text, buildHistory());
      const botMsg = { id: `a-${Date.now()}`, role: 'assistant', text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const errMsg = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: e.response?.data?.message?.includes('GEMINI_API_KEY')
          ? "⚠️ The AI key isn't set up on the server yet. See setup instructions."
          : "Sorry, I couldn't connect right now. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={15} color={COLORS.white} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.text}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={15} color={COLORS.white} />
          </View>
        )}
      </View>
    );
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={22} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Finance AI</Text>
            <Text style={styles.headerSubtitle}>Powered by Google Gemini</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading ? (
            <View style={[styles.row, styles.rowBot]}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={15} color={COLORS.white} />
              </View>
              <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestion chips */}
      {showSuggestions && (
        <View style={styles.suggestionsWrap}>
          <Text style={styles.suggestionsLabel}>Try asking:</Text>
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chip}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Ask about your finances..."
          placeholderTextColor={COLORS.placeholder}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: SIZES.paddingLg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...SHADOWS.large,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },

  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  row: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primaryDark || COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleBot: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  bubbleTextUser: { color: COLORS.white },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 20 },

  suggestionsWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionsLabel: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: COLORS.primary + '12',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  chipText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: SIZES.md,
    color: COLORS.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.small,
  },
  sendBtnOff: { backgroundColor: COLORS.border },
});

export default ChatScreen;
