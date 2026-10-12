import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

type JobStatus = 'Ready' | 'Needs review';

type SigningJob = {
  id: string;
  ipaFilename: string;
  bundleId: string;
  certificate: string;
  profile: string;
  createdAt: string;
  status: JobStatus;
};

type FieldErrors = {
  ipaFilename?: string;
  bundleId?: string;
};

const JOBS_KEY = '@esign-mobile/signing-jobs';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function PressableScale({
  children,
  onPress,
  style,
  disabled = false,
  accessibilityLabel,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 280 });
      }}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

function Field({
  label,
  hint,
  value,
  placeholder,
  onChangeText,
  error,
  colors,
  autoCapitalize = 'none',
  autoCorrect = false,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  colors: ReturnType<typeof useColors>;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoCorrect?: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
        {hint ? <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>{hint}</Text> : null}
      </View>
      <TextInput
        testID={`input-${label.toLowerCase().replaceAll(' ', '-')}`}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      />
      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReadinessItem({
  label,
  ready,
  colors,
}: {
  label: string;
  ready: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.readinessItem}>
      <View
        style={[
          styles.readinessIcon,
          { backgroundColor: ready ? colors.success : colors.muted },
        ]}
      >
        <Feather
          name={ready ? 'check' : 'minus'}
          size={14}
          color={ready ? colors.successForeground : colors.mutedForeground}
        />
      </View>
      <View style={styles.readinessCopy}>
        <Text style={[styles.readinessLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.readinessValue, { color: ready ? colors.success : colors.foreground }]}>
          {ready ? 'Attached' : 'Not set'}
        </Text>
      </View>
    </View>
  );
}

function JobRow({
  job,
  colors,
  onClear,
}: {
  job: SigningJob;
  colors: ReturnType<typeof useColors>;
  onClear: (job: SigningJob) => void;
}) {
  const createdLabel = new Date(job.createdAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Animated.View entering={FadeInUp.duration(360)} style={[styles.jobRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.jobFileIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="file" size={18} color={colors.primary} />
      </View>
      <View style={styles.jobDetails}>
        <Text numberOfLines={1} style={[styles.jobFilename, { color: colors.foreground }]}>
          {job.ipaFilename}
        </Text>
        <Text numberOfLines={1} style={[styles.jobBundle, { color: colors.mutedForeground }]}>
          {job.bundleId}
        </Text>
        <View style={styles.jobMeta}>
          <View style={[styles.statusDot, { backgroundColor: job.status === 'Ready' ? colors.success : colors.warning }]} />
          <Text style={[styles.jobStatus, { color: job.status === 'Ready' ? colors.success : colors.warning }]}>
            {job.status}
          </Text>
          <Text style={[styles.jobTime, { color: colors.mutedForeground }]}>{createdLabel}</Text>
        </View>
      </View>
      <PressableScale
        accessibilityLabel={`Clear ${job.ipaFilename}`}
        onPress={() => onClear(job)}
        style={styles.iconButton}
      >
        <Feather name="trash-2" size={17} color={colors.mutedForeground} />
      </PressableScale>
    </Animated.View>
  );
}

export default function IndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [ipaFilename, setIpaFilename] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [certificate, setCertificate] = useState('');
  const [profile, setProfile] = useState('');
  const [jobs, setJobs] = useState<SigningJob[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [storageError, setStorageError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingJob, setConfirmingJob] = useState<SigningJob | null>(null);

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(JOBS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SigningJob[];
        setJobs(Array.isArray(parsed) ? parsed : []);
      } else {
        setJobs([]);
      }
      setStorageError('');
    } catch {
      setStorageError('Saved jobs could not be read. You can still create a new local job.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const persistJobs = useCallback(async (nextJobs: SigningJob[]) => {
    setJobs(nextJobs);
    try {
      await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(nextJobs));
      setStorageError('');
    } catch {
      setStorageError('This job is visible for now, but could not be saved locally.');
    }
  }, []);

  const readiness = useMemo(
    () => ({
      bundle: bundleId.trim().length > 0,
      certificate: certificate.trim().length > 0,
      profile: profile.trim().length > 0,
    }),
    [bundleId, certificate, profile],
  );

  const resetForm = useCallback(() => {
    setIpaFilename('');
    setBundleId('');
    setCertificate('');
    setProfile('');
    setFieldErrors({});
    void Haptics.selectionAsync();
  }, []);

  const validate = useCallback(() => {
    const nextErrors: FieldErrors = {};
    const filename = ipaFilename.trim();
    if (!filename) nextErrors.ipaFilename = 'Add the IPA filename.';
    else if (!filename.toLowerCase().endsWith('.ipa')) nextErrors.ipaFilename = 'Filename must end in .ipa.';
    if (!bundleId.trim()) nextErrors.bundleId = 'Bundle identifier is required.';
    setFieldErrors(nextErrors);
    return nextErrors;
  }, [bundleId, ipaFilename]);

  const createJob = useCallback(async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const nextJob: SigningJob = {
      id: makeId(),
      ipaFilename: ipaFilename.trim(),
      bundleId: bundleId.trim(),
      certificate: certificate.trim(),
      profile: profile.trim(),
      createdAt: new Date().toISOString(),
      status: certificate.trim() && profile.trim() ? 'Ready' : 'Needs review',
    };
    await persistJobs([nextJob, ...jobs]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  }, [bundleId, certificate, ipaFilename, jobs, persistJobs, profile, resetForm, validate]);

  const requestClear = useCallback((job: SigningJob) => {
    void Haptics.selectionAsync();
    if (Platform.OS === 'web') {
      setConfirmingJob(job);
      return;
    }
    Alert.alert('Clear local job?', `${job.ipaFilename} will be removed from this device.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void persistJobs(jobs.filter((item) => item.id !== job.id));
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [jobs, persistJobs]);

  const confirmClear = useCallback(async () => {
    if (!confirmingJob) return;
    await persistJobs(jobs.filter((item) => item.id !== confirmingJob.id));
    setConfirmingJob(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [confirmingJob, jobs, persistJobs]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
          <View style={styles.brand}>
            <Image source={require('@/assets/images/icon.png')} style={styles.brandIcon} />
            <View>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>ESIGN / LOCAL WORKSPACE</Text>
              <Text style={[styles.brandName, { color: colors.foreground }]}>ESign Mobile</Text>
            </View>
          </View>
          <View style={[styles.privacyPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={[styles.privacyDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.privacyText, { color: colors.success }]}>LOCAL ONLY</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(450)} style={styles.hero}>
          <View style={[styles.heroRule, { backgroundColor: colors.primary }]} />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Prepare a signing job.</Text>
          <Text style={[styles.heroCopy, { color: colors.mutedForeground }]}>
            Keep the authorized IPA, identity, profile, and bundle ID together before you sign.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(450)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeading}>
            <View>
              <Text style={[styles.sectionKicker, { color: colors.primary }]}>01 / WORKSPACE</Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>New local job</Text>
            </View>
            <PressableScale accessibilityLabel="Reset form" onPress={resetForm} style={styles.resetButton}>
              <Feather name="rotate-ccw" size={15} color={colors.mutedForeground} />
              <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Reset</Text>
            </PressableScale>
          </View>

          <Field
            label="IPA filename"
            hint="required"
            value={ipaFilename}
            placeholder="MyApp-release.ipa"
            onChangeText={(value) => {
              setIpaFilename(value);
              if (fieldErrors.ipaFilename) setFieldErrors((current) => ({ ...current, ipaFilename: undefined }));
            }}
            error={fieldErrors.ipaFilename}
            colors={colors}
            autoCapitalize="none"
          />
          <Field
            label="Bundle identifier"
            hint="required"
            value={bundleId}
            placeholder="com.example.myapp"
            onChangeText={(value) => {
              setBundleId(value);
              if (fieldErrors.bundleId) setFieldErrors((current) => ({ ...current, bundleId: undefined }));
            }}
            error={fieldErrors.bundleId}
            colors={colors}
          />
          <Field
            label="Certificate label"
            hint="optional"
            value={certificate}
            placeholder="Apple Distribution · Team name"
            onChangeText={setCertificate}
            colors={colors}
            autoCapitalize="words"
          />
          <Field
            label="Provisioning profile label"
            hint="optional"
            value={profile}
            placeholder="App Store profile · 2025"
            onChangeText={setProfile}
            colors={colors}
            autoCapitalize="words"
          />

          <PressableScale
            testID="create-signing-job"
            accessibilityLabel="Create signing job"
            onPress={() => void createJob()}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Create signing job</Text>
            <Feather name="arrow-up-right" size={19} color={colors.primaryForeground} />
          </PressableScale>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(230).duration(450)}
          style={[styles.readinessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.readinessHeader}>
            <View>
              <Text style={[styles.sectionKicker, { color: colors.accent }]}>CHECK / READINESS</Text>
              <Text style={[styles.readinessTitle, { color: colors.foreground }]}>Inputs on deck</Text>
            </View>
            <Feather name="activity" size={18} color={colors.accent} />
          </View>
          <View style={styles.readinessGrid}>
            <ReadinessItem label="Bundle ID" ready={readiness.bundle} colors={colors} />
            <ReadinessItem label="Certificate" ready={readiness.certificate} colors={colors} />
            <ReadinessItem label="Profile" ready={readiness.profile} colors={colors} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.jobsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionKicker, { color: colors.primary }]}>02 / RECENT</Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Signing jobs</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>{jobs.length}</Text>
            </View>
          </View>
          {storageError ? (
            <View style={[styles.storageNotice, { backgroundColor: colors.secondary }]}>
              <Feather name="hard-drive" size={14} color={colors.warning} />
              <Text style={[styles.storageText, { color: colors.warning }]}>{storageError}</Text>
              <PressableScale
                accessibilityLabel="Retry loading local jobs"
                onPress={() => void loadJobs()}
                style={styles.retryButton}
              >
                <Feather name="refresh-cw" size={14} color={colors.warning} />
              </PressableScale>
            </View>
          ) : null}
          {isLoading ? (
            <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.muted }]} />
              <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                <View style={[styles.skeletonLineShort, { backgroundColor: colors.muted }]} />
              </View>
            </View>
          ) : jobs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="inbox" size={20} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jobs saved yet</Text>
              <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
                Your local signing workspace will appear here after the first save.
              </Text>
            </View>
          ) : (
            <View style={[styles.jobsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} colors={colors} onClear={requestClear} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={[styles.disclaimer, { borderTopColor: colors.border }]}>
          <Feather name="shield" size={17} color={colors.accent} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            ESign Mobile prepares authorized signing jobs locally. It does not bypass Apple’s certificates, profiles, or signing requirements.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>

      <Modal visible={!!confirmingJob} transparent animationType="fade" onRequestClose={() => setConfirmingJob(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.background + 'E6' }]}>
          <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.confirmIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="trash-2" size={21} color={colors.destructive} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Clear local job?</Text>
            <Text style={[styles.confirmCopy, { color: colors.mutedForeground }]}>
              This removes {confirmingJob?.ipaFilename ?? 'this job'} from this device.
            </Text>
            <View style={styles.confirmActions}>
              <PressableScale onPress={() => setConfirmingJob(null)} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Keep</Text>
              </PressableScale>
              <PressableScale onPress={() => void confirmClear()} style={[styles.deleteButton, { backgroundColor: colors.destructive }]}>
                <Text style={[styles.deleteButtonText, { color: colors.destructiveForeground }]}>Clear job</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandIcon: { width: 42, height: 42, borderRadius: 12 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.6, marginBottom: 3 },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.5 },
  privacyPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  privacyDot: { width: 6, height: 6, borderRadius: 3 },
  privacyText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  hero: { marginBottom: 25 },
  heroRule: { width: 36, height: 3, marginBottom: 13 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 38, letterSpacing: -1.2 },
  heroCopy: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginTop: 9, maxWidth: 440 },
  card: { borderWidth: 1, borderRadius: 18, padding: 17, marginBottom: 13 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 21 },
  sectionKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 5 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.5 },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, minHeight: 36 },
  resetText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  field: { marginBottom: 15 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  fieldHint: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { minHeight: 49, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 14 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  primaryButton: { minHeight: 53, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.1 },
  readinessCard: { borderWidth: 1, borderRadius: 15, padding: 16, marginBottom: 28 },
  readinessHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 },
  readinessTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  readinessGrid: { flexDirection: 'row', gap: 12 },
  readinessItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  readinessIcon: { width: 25, height: 25, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  readinessCopy: { flex: 1 },
  readinessLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, marginBottom: 2 },
  readinessValue: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  jobsSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  countBadge: { minWidth: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  storageNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 9, marginBottom: 10 },
  storageText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  retryButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 90, borderWidth: 1, borderRadius: 14, padding: 15 },
  skeletonIcon: { width: 39, height: 39, borderRadius: 11 },
  skeletonLines: { flex: 1, gap: 9 },
  skeletonLine: { width: '62%', height: 12, borderRadius: 6 },
  skeletonLineShort: { width: '37%', height: 9, borderRadius: 5 },
  emptyCard: { alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 26 },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 5 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 270 },
  jobsCard: { borderWidth: 1, borderRadius: 14, paddingLeft: 13 },
  jobRow: { flexDirection: 'row', alignItems: 'center', minHeight: 94, paddingVertical: 13, paddingRight: 10, borderBottomWidth: 1 },
  jobFileIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  jobDetails: { flex: 1, minWidth: 0 },
  jobFilename: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 4 },
  jobBundle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 7 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  jobStatus: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  jobTime: { fontFamily: 'Inter_400Regular', fontSize: 10, marginLeft: 3 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 3 },
  disclaimer: { flexDirection: 'row', gap: 9, borderTopWidth: 1, paddingTop: 16, marginTop: 2 },
  disclaimerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.5 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  confirmCard: { width: '100%', maxWidth: 380, borderWidth: 1, borderRadius: 18, padding: 20 },
  confirmIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  confirmTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, marginBottom: 7 },
  confirmCopy: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 21 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  deleteButton: { flex: 1, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});