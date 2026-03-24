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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Pedometer } from "expo-sensors";

export default function StepsScreen() {
    const [steps, setSteps] = useState(0);
    const [goal, setGoal] = useState(0);

    const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
    const [liveSteps, setLiveSteps] = useState(0);

    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const [stepsModalVisible, setStepsModalVisible] = useState(false);

    const [goalInput, setGoalInput] = useState("");
    const [stepsInput, setStepsInput] = useState("");

    const progress = goal > 0 ? Math.min((steps / goal) * 100, 100).toFixed(0) : 0;
    const calories = Math.floor(steps * 0.04);
    const distance = (steps * 0.0008).toFixed(2);
    const activeMinutes = Math.floor(steps / 100);

    const stepsLeft = goal > 0 ? Math.max(goal - steps, 0) : 0;

    const handleSetGoal = () => {
        const newGoal = parseInt(goalInput);

        if (!newGoal || newGoal <= 0) {
            Alert.alert("Invalid Goal", "Please enter a valid step goal.");
            return;
        }

        setGoal(newGoal);
        setGoalInput("");
        setGoalModalVisible(false);
    };

    const handleAddSteps = () => {
        const newSteps = parseInt(stepsInput);

        if (!newSteps || newSteps <= 0) {
            Alert.alert("Invalid Steps", "Please enter valid steps.");
            return;
        }

        setSteps((prev) => prev + newSteps);
        setStepsInput("");
        setStepsModalVisible(false);
    };

    const handleReset = () => {
        Alert.alert("Reset Data", "Do you want to reset today's steps?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reset",
                style: "destructive",
                onPress: () => {
                    setSteps(0);
                },
            },
        ]);
    };

    useEffect(() => {
        console.log("useEffect started");

        let subscription;

        const subscribe = async () => {
            console.log("subscribe function started");

            const available = await Pedometer.isAvailableAsync();
            console.log("Pedometer available:", available);

            setIsPedometerAvailable(String(available));

            if (!available) return;

            subscription = Pedometer.watchStepCount(result => {
                console.log("Live steps:", result.steps);
                setLiveSteps(result.steps);
                setSteps(result.steps);
            });
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
                    <Text style={styles.header}>Steps Tracker</Text>

                    <TouchableOpacity
                        style={styles.goalButton}
                        onPress={() => setGoalModalVisible(true)}
                    >
                        <Text style={styles.goalButtonText}>
                            {goal > 0 ? "Edit Goal" : "Set Goal"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bigCard}>
                    <View style={styles.circleOuter}>
                        <View style={styles.circleInner}>
                            <Ionicons name="walk" size={30} color="#00E676" />
                            <Text style={styles.stepsText}>{steps}</Text>
                            <Text style={styles.stepsSubText}>steps today</Text>
                        </View>
                    </View>

                    <Text style={styles.progressText}>
                        {goal > 0 ? `${progress}% of your daily goal` : "No goal set yet"}
                    </Text>

                    <Text style={styles.goalText}>
                        {goal > 0 ? `Goal: ${goal} steps` : "Tap Set Goal to begin"}
                    </Text>

                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                            <Text style={styles.resetButtonText}>Reset</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Today’s Activity</Text>

                <View style={styles.statsGrid}>
                    <View style={styles.smallCard}>
                        <Ionicons name="flame-outline" size={26} color="#FFB300" />
                        <Text style={styles.cardValue}>{calories}</Text>
                        <Text style={styles.cardLabel}>Calories Burned</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <Ionicons name="location-outline" size={26} color="#4FC3F7" />
                        <Text style={styles.cardValue}>{distance} km</Text>
                        <Text style={styles.cardLabel}>Distance</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <MaterialIcons name="timer" size={26} color="#B388FF" />
                        <Text style={styles.cardValue}>{activeMinutes} min</Text>
                        <Text style={styles.cardLabel}>Active Time</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <Ionicons name="footsteps-outline" size={26} color="#00E676" />
                        <Text style={styles.cardValue}>{stepsLeft}</Text>
                        <Text style={styles.cardLabel}>Steps Left</Text>
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
        borderRadius: 26,
        padding: 24,
        alignItems: "center",
        marginBottom: 24,
    },
    circleOuter: {
        width: 210,
        height: 210,
        borderRadius: 105,
        borderWidth: 12,
        borderColor: "#243654",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    circleInner: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "#0C1A32",
        alignItems: "center",
        justifyContent: "center",
    },
    stepsText: {
        color: "#FFFFFF",
        fontSize: 34,
        fontWeight: "800",
        marginTop: 8,
    },
    stepsSubText: {
        color: "#AEB9CC",
        fontSize: 15,
        marginTop: 4,
    },
    progressText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
        textAlign: "center",
    },
    goalText: {
        color: "#AEB9CC",
        fontSize: 14,
        marginBottom: 14,
        textAlign: "center",
    },
    progressBarBg: {
        width: "100%",
        height: 12,
        backgroundColor: "#0E1B32",
        borderRadius: 20,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#00E676",
        borderRadius: 20,
    },
    actionButtonsRow: {
        flexDirection: "row",
        marginTop: 18,
        gap: 12,
    },
    actionButton: {
        backgroundColor: "#00E676",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 14,
    },
    actionButtonText: {
        color: "#03142B",
        fontWeight: "800",
        fontSize: 14,
    },
    resetButton: {
        backgroundColor: "#334155",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 14,
    },
    resetButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 14,
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
        borderRadius: 22,
        paddingVertical: 22,
        paddingHorizontal: 14,
        alignItems: "center",
        marginBottom: 14,
    },
    cardValue: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
        marginTop: 8,
    },
    cardLabel: {
        color: "#AEB9CC",
        fontSize: 13,
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