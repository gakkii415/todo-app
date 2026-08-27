import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

const STORAGE_KEY = '@todo-app/todos';
const MAX_TITLE_LENGTH = 80;

const FILTERS = [
  { key: 'all', label: 'すべて' },
  { key: 'open', label: '未完了' },
  { key: 'done', label: '完了' },
];

const LIGHT_COLORS = {
  background: '#F1F4EF',
  surface: '#FAFCF8',
  surfaceStrong: '#FFFFFF',
  ink: '#1C261F',
  muted: '#6D776F',
  line: '#D8E0D8',
  accent: '#2D6A4F',
  accentSoft: '#DDECE3',
  danger: '#B44D42',
  dangerSoft: '#F7E5E2',
  overlay: 'rgba(15, 24, 18, 0.48)',
  shadow: '#172A1D',
};

const DARK_COLORS = {
  background: '#101511',
  surface: '#171E19',
  surfaceStrong: '#1D2720',
  ink: '#F0F5F1',
  muted: '#97A39A',
  line: '#2D3930',
  accent: '#75C69B',
  accentSoft: '#213D2D',
  danger: '#F08B7D',
  dangerSoft: '#4B2926',
  overlay: 'rgba(0, 0, 0, 0.68)',
  shadow: '#000000',
};

const DISPLAY_FONT = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  default: 'sans-serif',
});

export default function App() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [text, setText] = useState('');
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadTodos = async () => {
      try {
        const savedTodos = await AsyncStorage.getItem(STORAGE_KEY);
        if (!savedTodos || !isActive) return;

        const parsedTodos = JSON.parse(savedTodos);
        if (!Array.isArray(parsedTodos)) throw new Error('Invalid saved data');

        const validTodos = parsedTodos
          .filter(
            (todo) =>
              todo &&
              typeof todo.id === 'string' &&
              typeof todo.title === 'string' &&
              typeof todo.done === 'boolean'
          )
          .map(({ id, title, done }) => ({ id, title, done }));

        setTodos(validTodos);
      } catch {
        if (isActive) {
          setStorageNotice('保存済みのTodoを読み込めませんでした。');
        }
      } finally {
        if (isActive) setIsHydrated(true);
      }
    };

    loadTodos();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos)).catch(() => {
      setStorageNotice('Todoを端末に保存できませんでした。');
    });
  }, [isHydrated, todos]);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }).format(new Date()),
    []
  );

  const openCount = todos.filter((todo) => !todo.done).length;
  const doneCount = todos.length - openCount;
  const progress = todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100);
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'open') return !todo.done;
    if (filter === 'done') return todo.done;
    return true;
  });

  const addTodo = () => {
    const title = text.trim();
    if (!title || !isHydrated) return;

    setTodos((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        done: false,
      },
    ]);
    setText('');
    setFilter('all');
  };

  const toggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const requestDelete = (todo) => {
    Alert.alert('このTodoを削除しますか？', `「${todo.title}」`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () =>
          setTodos((current) => current.filter((item) => item.id !== todo.id)),
      },
    ]);
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = () => {
    const title = editingText.trim();
    if (!title) return;

    setTodos((current) =>
      current.map((todo) => (todo.id === editingId ? { ...todo, title } : todo))
    );
    closeEditor();
  };

  const filterCount = (filterKey) => {
    if (filterKey === 'open') return openCount;
    if (filterKey === 'done') return doneCount;
    return todos.length;
  };

  const statusText = !isHydrated
    ? '保存済みのTodoを読み込んでいます。'
    : todos.length === 0
    ? '思いついたら、まず1件追加しましょう。'
    : openCount === 0
    ? '今日のTodoはすべて完了です。'
    : `あと${openCount}件。終わったら丸をタップ。`;

  const emptyState =
    filter === 'open'
      ? {
          mark: '✓',
          title: '未完了のTodoはありません',
          body: '完了したTodoは「完了」から確認できます。',
        }
      : filter === 'done'
      ? {
          mark: '○',
          title: '完了したTodoはまだありません',
          body: '終わったTodoの丸をタップすると、ここに表示されます。',
        }
      : {
          mark: '＋',
          title: '最初のTodoを追加しましょう',
          body: '上の入力欄に、次にやることを短く入力します。',
        };

  const canAdd = isHydrated && text.trim().length > 0;
  const canSaveEdit = editingText.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.date}>{dateLabel}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>今日やること</Text>
              <View style={styles.countPill}>
                <Text style={styles.countNumber}>{isHydrated ? openCount : '—'}</Text>
                <Text style={styles.countLabel}>残り</Text>
              </View>
            </View>
            <Text style={styles.statusText}>{statusText}</Text>
            <View
              accessibilityLabel={`Todoの完了率 ${progress}パーセント`}
              accessibilityRole="progressbar"
              style={styles.progressTrack}
            >
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="新しいTodo"
              editable={isHydrated}
              maxLength={MAX_TITLE_LENGTH}
              onChangeText={setText}
              onSubmitEditing={addTodo}
              placeholder={isHydrated ? '例：クリーニングを受け取る' : '読み込み中…'}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              selectionColor={colors.accent}
              style={styles.input}
              value={text}
            />
            <Pressable
              accessibilityLabel="Todoを追加"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAdd }}
              disabled={!canAdd}
              onPress={addTodo}
              style={({ pressed }) => [
                styles.addButton,
                !canAdd && styles.buttonDisabled,
                pressed && canAdd && styles.buttonPressed,
              ]}
            >
              <Text style={styles.addButtonText}>追加</Text>
            </Pressable>
          </View>

          <View accessibilityRole="tablist" style={styles.filterRow}>
            {FILTERS.map((item) => {
              const isSelected = filter === item.key;
              return (
                <Pressable
                  accessibilityLabel={`${item.label} ${filterCount(item.key)}件`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={({ pressed }) => [
                    styles.filterButton,
                    isSelected && styles.filterButtonActive,
                    pressed && styles.filterButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isSelected && styles.filterTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.filterCount,
                      isSelected && styles.filterCountActive,
                    ]}
                  >
                    {filterCount(item.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {storageNotice ? (
            <View accessibilityRole="alert" style={styles.notice}>
              <Text style={styles.noticeText}>{storageNotice}</Text>
              <Pressable
                accessibilityLabel="お知らせを閉じる"
                hitSlop={10}
                onPress={() => setStorageNotice('')}
              >
                <Text style={styles.noticeClose}>閉じる</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.listPanel}>
            <FlatList
              contentContainerStyle={[
                styles.listContent,
                visibleTodos.length === 0 && styles.emptyList,
              ]}
              data={isHydrated ? visibleTodos : []}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyMark}>
                    <Text style={styles.emptyMarkText}>
                      {isHydrated ? emptyState.mark : '…'}
                    </Text>
                  </View>
                  <Text style={styles.emptyTitle}>
                    {isHydrated ? emptyState.title : 'Todoを読み込んでいます'}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {isHydrated ? emptyState.body : '少しだけお待ちください。'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.todoRow, item.done && styles.todoRowDone]}>
                  <Pressable
                    accessibilityLabel={
                      item.done
                        ? `${item.title}を未完了に戻す`
                        : `${item.title}を完了にする`
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done }}
                    hitSlop={6}
                    onPress={() => toggleTodo(item.id)}
                    style={({ pressed }) => [
                      styles.checkButton,
                      item.done && styles.checkButtonDone,
                      pressed && styles.checkButtonPressed,
                    ]}
                  >
                    <Text style={styles.checkText}>{item.done ? '✓' : ''}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityHint="タスク名を変更します"
                    accessibilityLabel={`${item.title}を編集`}
                    accessibilityRole="button"
                    onPress={() => startEditing(item)}
                    style={({ pressed }) => [
                      styles.todoMain,
                      pressed && styles.todoMainPressed,
                    ]}
                  >
                    <Text style={[styles.todoText, item.done && styles.doneText]}>
                      {item.title}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`${item.title}を削除`}
                    accessibilityRole="button"
                    hitSlop={4}
                    onPress={() => requestDelete(item)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.deleteButtonPressed,
                    ]}
                  >
                    <Text style={styles.deleteText}>削除</Text>
                  </Pressable>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <Text style={styles.footerHint}>タスク名をタップすると編集できます</Text>
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        onRequestClose={closeEditor}
        transparent
        visible={editingId !== null}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View accessibilityViewIsModal style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>TODOを編集</Text>
            <Text style={styles.modalTitle}>やることを書き直す</Text>
            <TextInput
              accessibilityLabel="編集するTodo"
              autoFocus
              maxLength={MAX_TITLE_LENGTH}
              onChangeText={setEditingText}
              onSubmitEditing={saveEdit}
              placeholder="やることを入力"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              selectionColor={colors.accent}
              style={styles.modalInput}
              value={editingText}
            />
            <Text style={styles.characterCount}>
              {editingText.length} / {MAX_TITLE_LENGTH}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeEditor}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSaveEdit }}
                disabled={!canSaveEdit}
                onPress={saveEdit}
                style={({ pressed }) => [
                  styles.saveButton,
                  !canSaveEdit && styles.buttonDisabled,
                  pressed && canSaveEdit && styles.buttonPressed,
                ]}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    header: {
      marginBottom: 18,
    },
    date: {
      color: colors.accent,
      fontFamily: DISPLAY_FONT,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 7,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    title: {
      flex: 1,
      color: colors.ink,
      fontFamily: DISPLAY_FONT,
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: -1.2,
      lineHeight: 42,
    },
    countPill: {
      minWidth: 60,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: colors.accentSoft,
    },
    countNumber: {
      color: colors.accent,
      fontFamily: DISPLAY_FONT,
      fontSize: 20,
      fontWeight: '700',
    },
    countLabel: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    statusText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 7,
    },
    progressTrack: {
      height: 4,
      overflow: 'hidden',
      marginTop: 13,
      borderRadius: 999,
      backgroundColor: colors.line,
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    inputRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      padding: 5,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      backgroundColor: colors.surfaceStrong,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 18,
      elevation: 2,
    },
    input: {
      flex: 1,
      minHeight: 46,
      color: colors.ink,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    addButton: {
      minWidth: 68,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.accent,
    },
    addButtonText: {
      color: colors.surfaceStrong,
      fontSize: 15,
      fontWeight: '700',
    },
    buttonDisabled: {
      opacity: 0.36,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    filterRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 12,
      padding: 4,
      borderRadius: 15,
      backgroundColor: colors.accentSoft,
    },
    filterButton: {
      minHeight: 44,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      borderRadius: 11,
    },
    filterButtonActive: {
      backgroundColor: colors.surfaceStrong,
    },
    filterButtonPressed: {
      opacity: 0.65,
    },
    filterText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    filterTextActive: {
      color: colors.ink,
    },
    filterCount: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
    },
    filterCountActive: {
      color: colors.accent,
    },
    notice: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: colors.dangerSoft,
    },
    noticeText: {
      flex: 1,
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    noticeClose: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '700',
    },
    listPanel: {
      flex: 1,
      minHeight: 180,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 22,
      backgroundColor: colors.surface,
    },
    listContent: {
      paddingHorizontal: 16,
    },
    emptyList: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    separator: {
      height: 1,
      marginLeft: 54,
      backgroundColor: colors.line,
    },
    todoRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
    },
    todoRowDone: {
      opacity: 0.72,
    },
    checkButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: 22,
      backgroundColor: colors.surfaceStrong,
    },
    checkButtonDone: {
      backgroundColor: colors.accent,
    },
    checkButtonPressed: {
      transform: [{ scale: 0.92 }],
    },
    checkText: {
      color: colors.surfaceStrong,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 23,
    },
    todoMain: {
      minHeight: 48,
      flex: 1,
      justifyContent: 'center',
      borderRadius: 8,
      paddingHorizontal: 2,
      paddingVertical: 6,
    },
    todoMainPressed: {
      opacity: 0.56,
    },
    todoText: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 23,
    },
    doneText: {
      color: colors.muted,
      textDecorationLine: 'line-through',
    },
    deleteButton: {
      minWidth: 48,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    deleteButtonPressed: {
      backgroundColor: colors.dangerSoft,
    },
    deleteText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    emptyMark: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.line,
      borderRadius: 27,
      backgroundColor: colors.surfaceStrong,
    },
    emptyMarkText: {
      color: colors.accent,
      fontSize: 23,
      fontWeight: '700',
    },
    emptyTitle: {
      color: colors.ink,
      fontFamily: DISPLAY_FONT,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptyBody: {
      maxWidth: 290,
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 6,
      textAlign: 'center',
    },
    footerHint: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 8,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.overlay,
    },
    modalCard: {
      width: '100%',
      maxWidth: 460,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 22,
      backgroundColor: colors.surfaceStrong,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.22,
      shadowRadius: 30,
      elevation: 10,
    },
    modalEyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginBottom: 6,
    },
    modalTitle: {
      color: colors.ink,
      fontFamily: DISPLAY_FONT,
      fontSize: 23,
      fontWeight: '700',
      marginBottom: 17,
    },
    modalInput: {
      minHeight: 52,
      color: colors.ink,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 13,
      backgroundColor: colors.surface,
      fontSize: 16,
    },
    characterCount: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 7,
      textAlign: 'right',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 18,
    },
    cancelButton: {
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 13,
    },
    cancelButtonText: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryButtonPressed: {
      backgroundColor: colors.accentSoft,
    },
    saveButton: {
      minWidth: 82,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderRadius: 13,
      backgroundColor: colors.accent,
    },
    saveButtonText: {
      color: colors.surfaceStrong,
      fontSize: 14,
      fontWeight: '700',
    },
  });
