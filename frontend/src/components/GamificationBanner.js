import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGamification } from '../context/GamificationContext';
import { useLanguage } from '../context/LanguageContext';
import { ACHIEVEMENTS, getLevelProgress } from '../constants/gamification';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const GamificationBanner = () => {
  const {
    totalPoints,
    streak,
    currentLevel,
    nextLevel,
    unlockedAchievements,
    newAchievement,
    lastPointsEarned,
    clearNewAchievement,
    clearLastPoints,
  } = useGamification();
  const { t, language } = useLanguage();

  const [showAchievements, setShowAchievements] = useState(false);
  const [toastAnim] = useState(new Animated.Value(0));
  const [achievementAnim] = useState(new Animated.Value(0));

  const progress = getLevelProgress(totalPoints);

  const getLevelTitle = (level) => {
    if (!level) return '';
    if (language === 'am') return level.titleAm;
    if (language === 'om') return level.titleOm;
    return level.title;
  };

  const getAchTitle = (ach) => {
    if (language === 'am') return ach.titleAm;
    if (language === 'om') return ach.titleOm;
    return ach.title;
  };

  const getAchDesc = (ach) => {
    if (language === 'am') return ach.descAm;
    if (language === 'om') return ach.descOm;
    return ach.description;
  };

  // Toast for points earned
  useEffect(() => {
    if (lastPointsEarned) {
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => clearLastPoints());
    }
  }, [lastPointsEarned]);

  // Achievement popup
  useEffect(() => {
    if (newAchievement) {
      Animated.sequence([
        Animated.timing(achievementAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(achievementAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => clearNewAchievement());
    }
  }, [newAchievement]);

  return (
    <>
      {/* Points Toast */}
      {lastPointsEarned && (
        <Animated.View
          style={[
            styles.pointsToast,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <Ionicons name="star" size={14} color="#FCD34D" />
          <Text style={styles.pointsToastText}>+{lastPointsEarned.amount} {t('points')}</Text>
        </Animated.View>
      )}

      {/* Achievement Toast */}
      {newAchievement && (
        <Animated.View
          style={[
            styles.achievementToast,
            {
              opacity: achievementAnim,
              transform: [{
                scale: achievementAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.05, 1] }),
              }],
            },
          ]}
        >
          <View style={[styles.achievementToastIcon, { backgroundColor: newAchievement.color + '20' }]}>
            <Ionicons name={newAchievement.icon} size={24} color={newAchievement.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementToastLabel}>{t('achievementUnlocked')}</Text>
            <Text style={styles.achievementToastTitle}>{getAchTitle(newAchievement)}</Text>
          </View>
        </Animated.View>
      )}

      {/* Main Banner */}
      <TouchableOpacity
        style={[styles.banner, SHADOWS.small]}
        onPress={() => setShowAchievements(true)}
        activeOpacity={0.85}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.levelBadge}>
            <Ionicons name={currentLevel.icon} size={20} color={COLORS.white} />
          </View>
          <View style={styles.bannerInfo}>
            <View style={styles.levelRow}>
              <Text style={styles.levelText}>{t('level')} {currentLevel.level}</Text>
              <Text style={styles.levelTitle}>{getLevelTitle(currentLevel)}</Text>
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${Math.max(progress * 100, 5)}%` }]} />
            </View>
            <Text style={styles.xpText}>
              {totalPoints} {t('points')} {nextLevel ? `/ ${nextLevel.minPoints}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.bannerRight}>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#F97316" />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
          <View style={styles.badgeCount}>
            <Ionicons name="trophy" size={14} color="#FCD34D" />
            <Text style={styles.badgeCountText}>{unlockedAchievements.length}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievements}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAchievements(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('achievements')}</Text>
              <TouchableOpacity onPress={() => setShowAchievements(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Level Card */}
            <View style={[styles.levelCard, SHADOWS.small]}>
              <View style={styles.levelCardRow}>
                <View style={styles.levelBadgeLg}>
                  <Ionicons name={currentLevel.icon} size={28} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelCardTitle}>
                    {t('level')} {currentLevel.level} - {getLevelTitle(currentLevel)}
                  </Text>
                  <View style={styles.xpBarBgLg}>
                    <View style={[styles.xpBarFillLg, { width: `${Math.max(progress * 100, 3)}%` }]} />
                  </View>
                  <Text style={styles.xpTextLg}>
                    {totalPoints} / {nextLevel ? nextLevel.minPoints : t('maxLevel')} {t('points')}
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={18} color="#F97316" />
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>{t('dayStreak')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="star" size={18} color="#FCD34D" />
                  <Text style={styles.statValue}>{totalPoints}</Text>
                  <Text style={styles.statLabel}>{t('points')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="trophy" size={18} color="#8B5CF6" />
                  <Text style={styles.statValue}>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</Text>
                  <Text style={styles.statLabel}>{t('badges')}</Text>
                </View>
              </View>
            </View>

            {/* Achievement List */}
            <ScrollView style={styles.achievementList} showsVerticalScrollIndicator={false}>
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = unlockedAchievements.includes(ach.id);
                return (
                  <View
                    key={ach.id}
                    style={[styles.achievementItem, !unlocked && styles.achievementLocked]}
                  >
                    <View style={[styles.achIcon, { backgroundColor: unlocked ? ach.color + '20' : '#E2E8F0' }]}>
                      <Ionicons
                        name={ach.icon}
                        size={22}
                        color={unlocked ? ach.color : '#94A3B8'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.achTitle, !unlocked && styles.achTitleLocked]}>
                        {getAchTitle(ach)}
                      </Text>
                      <Text style={styles.achDesc}>{getAchDesc(ach)}</Text>
                    </View>
                    {unlocked && (
                      <Ionicons name="checkmark-circle" size={22} color={ach.color} />
                    )}
                    {!unlocked && (
                      <Ionicons name="lock-closed" size={18} color="#CBD5E1" />
                    )}
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pointsToast: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    zIndex: 100,
  },
  pointsToastText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementToast: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    zIndex: 99,
    ...SHADOWS.medium,
  },
  achievementToastIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementToastLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  achievementToastTitle: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.margin,
    marginTop: 12,
    borderRadius: SIZES.borderRadius,
    padding: 12,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  levelTitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  xpBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 3,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F97316',
  },
  badgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  levelCard: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    marginBottom: 16,
  },
  levelCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  levelBadgeLg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCardTitle: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  xpBarBgLg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFillLg: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  xpTextLg: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },

  // Achievement list
  achievementList: {
    paddingHorizontal: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: SIZES.borderRadius,
    marginBottom: 6,
    gap: 12,
    backgroundColor: COLORS.white,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achTitle: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  achTitleLocked: {
    color: COLORS.textLight,
  },
  achDesc: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default GamificationBanner;
