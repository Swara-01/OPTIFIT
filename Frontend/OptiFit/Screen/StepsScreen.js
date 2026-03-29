import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Pedometer } from "expo-sensors";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const cardWidth = screenWidth - 40;

export default function StepsScreen() {
    const [steps, setSteps] = useState(0);
    const [goal, setGoal] = useState(10000);
    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const [goalInput, setGoalInput] = useState("");
    const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);

    const progress = goal > 0 ? Math.min((steps / goal) * 100, 100) : 0;
    const calories = Math.floor(steps * 0.04);
    const distance = (steps * 0.0008).toFixed(2);
    const activeMinutes = Math.floor(steps / 100);
    const stepsLeft = goal > 0 ? Math.max(goal - steps, 0) : 0;
    const goalReached = steps >= goal;

    const getStatusMessage = () => {
        if (goalReached) return "Amazing! You completed your goal today.";
        if (progress >= 80) return "You are very close. Keep going!";
        if (progress >= 50) return "Great progress. Stay active!";
        return "Start moving to reach your daily target.";
    };

    const getTodayKey = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const getLast7DaysKeys = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split("T")[0]);
        }
        return days;
    };

    const getLast7DaysLabels = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3));
        }
        return days;
    };

    const saveTodaySteps = async (stepValue) => {
        try {
            const key = `steps-${getTodayKey()}`;
            await AsyncStorage.setItem(key, String(stepValue));
        } catch (error) {
            console.log("Save steps error:", error);
        }
    };

    const loadWeeklyData = async () => {
        try {
            const keys = getLast7DaysKeys();
            const values = await Promise.all(
                keys.map(async (key) => {
                    const value = await AsyncStorage.getItem(`steps-${key}`);
                    return value ? Number(value) : 0;
                })
            );
            setWeeklyData(values);
        } catch (error) {
            console.log("Load weekly data error:", error);
        }
    };

    const handleSetGoal = () => {
        const newGoal = parseInt(goalInput, 10);

        if (!newGoal || newGoal <= 0) {
            Alert.alert("Invalid Goal", "Please enter a valid step goal.");
            return;
        }

        setGoal(newGoal);
        setGoalInput("");
        setGoalModalVisible(false);
    };

    const handleReset = () => {
        Alert.alert("Reset Data", "Do you want to reset today's steps?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reset",
                style: "destructive",
                onPress: async () => {
                    setSteps(0);
                    await saveTodaySteps(0);
                    await loadWeeklyData();
                },
            },
        ]);
    };

    useEffect(() => {
        let subscription;
        let baseSteps = 0;

        const subscribe = async () => {
            try {
                const available = await Pedometer.isAvailableAsync();
                if (!available) return;

                const end = new Date();
                const start = new Date();
                start.setHours(0, 0, 0, 0);

                const todayResult = await Pedometer.getStepCountAsync(start, end);
                baseSteps = todayResult.steps || 0;

                setSteps(baseSteps);
                await saveTodaySteps(baseSteps);
                await loadWeeklyData();

                subscription = Pedometer.watchStepCount(async (result) => {
                    const updatedSteps = baseSteps + result.steps;
                    setSteps(updatedSteps);
                    await saveTodaySteps(updatedSteps);
                    await loadWeeklyData();
                });
            } catch (error) {
                console.log("Pedometer error:", error);
            }
        };

        subscribe();

        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.header}>Steps Tracker</Text>
                        <Text style={styles.subHeader}>Move more, feel better</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.goalButton}
                        onPress={() => setGoalModalVisible(true)}
                    >
                        <Text style={styles.goalButtonText}>Edit Goal</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bigCard}>
                    <AnimatedCircularProgress
                        size={190}
                        width={14}
                        fill={progress}
                        tintColor="#00E676"
                        backgroundColor="#243654"
                        rotation={0}
                        lineCap="round"
                    >
                        {() => (
                            <View style={styles.circleInner}>
                                <Ionicons name="walk" size={28} color="#00E676" />
                                <Text style={styles.stepsText}>{steps}</Text>
                                <Text style={styles.stepsSubText}>steps today</Text>
                            </View>
                        )}
                    </AnimatedCircularProgress>

                    <Text style={styles.progressText}>{progress.toFixed(0)}% completed</Text>
                    <Text style={styles.goalText}>Goal: {goal} steps</Text>

                    <View style={styles.chipsRow}>
                        <View style={styles.premiumChip}>
                            <Ionicons
                                name={goalReached ? "checkmark-circle" : "flag-outline"}
                                size={16}
                                color="#00E676"
                            />
                            <Text style={styles.premiumChipText}>
                                {goalReached ? "Goal reached" : `${stepsLeft} left`}
                            </Text>
                        </View>

                        <View style={styles.premiumChip}>
                            <Ionicons name="flash-outline" size={16} color="#38BDF8" />
                            <Text style={styles.premiumChipText}>{activeMinutes} active min</Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={cardWidth}
                    snapToAlignment="start"
                    contentContainerStyle={styles.swipeCardsContainer}
                    style={styles.swipeWrapper}
                >
                    <View style={[styles.swipeCard, { width: cardWidth }]}>
                        <View style={styles.statusTopRow}>
                            <Text style={styles.statusTitle}>Daily Status</Text>
                            <Text style={styles.statusPercent}>{progress.toFixed(0)}%</Text>
                        </View>

                        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

                        <Text style={styles.statusSub}>
                            {goalReached
                                ? "You did a great job today."
                                : `${stepsLeft} more steps needed to complete your target.`}
                        </Text>

                        <Text style={styles.swipeHint}>Swipe left for weekly steps →</Text>
                    </View>

                    <View style={[styles.swipeCard, { width: cardWidth }]}>
                        <View style={styles.weeklyHeader}>
                            <Text style={styles.weeklyTitle}>Weekly Steps</Text>
                            <TouchableOpacity style={styles.resetMiniBtn} onPress={handleReset}>
                                <Text style={styles.resetMiniText}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <LineChart
                            data={{
                                labels: getLast7DaysLabels(),
                                datasets: [{ data: weeklyData }],
                            }}
                            width={cardWidth - 24}
                            height={160}
                            withDots={true}
                            withInnerLines={false}
                            withOuterLines={false}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            fromZero={true}
                            bezier
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundGradientFrom: "#1A2740",
                                backgroundGradientTo: "#1A2740",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 230, 118, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(220, 227, 239, ${opacity})`,
                                propsForBackgroundLines: {
                                    stroke: "#243654",
                                },
                                propsForDots: {
                                    r: "4",
                                    strokeWidth: "2",
                                    stroke: "#00E676",
                                },
                            }}
                            style={styles.chart}
                        />

                        <Text style={styles.swipeHint}>← Swipe right for daily status</Text>
                    </View>
                </ScrollView>

                <View style={styles.statsGrid}>
                    <View style={styles.smallCard}>
                        <Ionicons name="flame-outline" size={24} color="#FFB300" />
                        <Text style={styles.cardValue}>{calories}</Text>
                        <Text style={styles.cardLabel}>Calories</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <Ionicons name="location-outline" size={24} color="#4FC3F7" />
                        <Text style={styles.cardValue}>{distance} km</Text>
                        <Text style={styles.cardLabel}>Distance</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <MaterialIcons name="timer" size={24} color="#B388FF" />
                        <Text style={styles.cardValue}>{activeMinutes} min</Text>
                        <Text style={styles.cardLabel}>Active Time</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <Ionicons name="footsteps-outline" size={24} color="#00E676" />
                        <Text style={styles.cardValue}>{stepsLeft}</Text>
                        <Text style={styles.cardLabel}>Left</Text>
                    </View>
                </View>

                <Modal
                    visible={goalModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setGoalModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Set Daily Goal</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter goal steps"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={goalInput}
                                onChangeText={setGoalInput}
                            />

                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSetGoal}>
                                <Text style={styles.modalSaveText}>Save Goal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setGoalModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#03142B",
        paddingHorizontal: 20,
    },
    headerRow: {
        marginTop: 18,
        marginBottom: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    header: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
    },
    subHeader: {
        color: "#94A3B8",
        fontSize: 13,
        marginTop: 4,
    },
    goalButton: {
        backgroundColor: "#1A2740",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    goalButtonText: {
        color: "#DCE3EF",
        fontSize: 13,
        fontWeight: "600",
    },
    bigCard: {
        backgroundColor: "#1A2740",
        borderRadius: 24,
        padding: 20,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#243654",
    },
    circleInner: {
        alignItems: "center",
        justifyContent: "center",
    },
    stepsText: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "800",
        marginTop: 8,
    },
    stepsSubText: {
        color: "#AEB9CC",
        fontSize: 14,
        marginTop: 4,
    },
    progressText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 14,
    },
    goalText: {
        color: "#AEB9CC",
        fontSize: 14,
        marginTop: 4,
    },
    chipsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    premiumChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0C1A32",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    premiumChipText: {
        color: "#E2E8F0",
        fontSize: 12,
        fontWeight: "600",
    },
    swipeWrapper: {
        marginBottom: 16,
    },
    swipeCardsContainer: {
        paddingRight: 0,
    },
    swipeCard: {
        backgroundColor: "#1A2740",
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "#243654",
        marginRight: 0,
        minHeight: 240,
        justifyContent: "space-between",
    },
    statusTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    statusTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },
    statusPercent: {
        color: "#00E676",
        fontWeight: "800",
        fontSize: 18,
    },
    statusMessage: {
        color: "#E2E8F0",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 6,
    },
    statusSub: {
        color: "#94A3B8",
        fontSize: 13,
        lineHeight: 20,
    },
    swipeHint: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 16,
        textAlign: "right",
    },
    weeklyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 2,
        marginBottom: 6,
    },
    weeklyTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
    },
    resetMiniBtn: {
        backgroundColor: "#0C1A32",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    resetMiniText: {
        color: "#DCE3EF",
        fontSize: 12,
        fontWeight: "700",
    },
    chart: {
        borderRadius: 16,
        alignSelf: "center",
        marginTop: 6,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    smallCard: {
        width: "48%",
        backgroundColor: "#1A2740",
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 12,
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#243654",
    },
    cardValue: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "800",
        marginTop: 8,
    },
    cardLabel: {
        color: "#AEB9CC",
        fontSize: 12,
        textAlign: "center",
        marginTop: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalBox: {
        width: "100%",
        backgroundColor: "#1A2740",
        borderRadius: 22,
        padding: 22,
    },
    modalTitle: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 16,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#0C1A32",
        color: "#FFFFFF",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 14,
    },
    modalSaveBtn: {
        backgroundColor: "#00E676",
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 10,
    },
    modalSaveText: {
        color: "#03142B",
        fontSize: 16,
        fontWeight: "800",
    },
    modalCancelBtn: {
        backgroundColor: "#334155",
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalCancelText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});