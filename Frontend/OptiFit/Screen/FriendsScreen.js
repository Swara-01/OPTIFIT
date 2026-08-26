import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import api from "../services/api"; // adjust path if FriendsScreen sits elsewhere

// ---------------------------------------------------------------------
// 🔧 Swap these for your friend's real routes once the backend is live.
// ---------------------------------------------------------------------
const ENDPOINTS = {
    getFriends: "/api/friends",
    getRequests: "/api/friends/requests",
    getSuggestions: "/api/friends/suggestions",
    sendRequest: "/api/friends/request",
    acceptRequest: "/api/friends/accept",
    rejectRequest: "/api/friends/reject",
};

const COLORS = {
    bg: "#0B1220",
    card: "#1E293B",
    accent: "#00E676",
    border: "#334155",
    textMuted: "#94A3B8",
    textFaint: "#64748B",
    white: "#FFFFFF",
    danger: "#F87171",
};

const TABS = ["All Friends", "Requests", "Invite"];

export default function FriendsScreen() {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [search, setSearch] = useState("");

    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const [friendsRes, requestsRes, suggestionsRes] = await Promise.all([
                api.get(ENDPOINTS.getFriends),
                api.get(ENDPOINTS.getRequests),
                api.get(ENDPOINTS.getSuggestions),
            ]);
            setFriends(friendsRes.data ?? []);
            setRequests(requestsRes.data ?? []);
            setSuggestions(suggestionsRes.data ?? []);
        } catch (err) {
            // Backend not live yet / network error — fail gracefully, keep empty states
            console.log("FriendsScreen fetch error:", err.message);
            setError("Couldn't load friends right now.");
            setFriends([]);
            setRequests([]);
            setSuggestions([]);
        } finally {
            isRefresh ? setRefreshing(false) : setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const onRefresh = () => fetchAll(true);

    const filteredFriends = useMemo(
        () =>
            friends.filter((f) =>
                f.name?.toLowerCase().includes(search.toLowerCase())
            ),
        [friends, search]
    );

    const filteredSuggestions = useMemo(
        () =>
            suggestions.filter((s) =>
                s.name?.toLowerCase().includes(search.toLowerCase())
            ),
        [suggestions, search]
    );

    const handleAccept = async (id) => {
        const accepted = requests.find((r) => r.id === id);
        // Optimistic update
        setRequests((prev) => prev.filter((r) => r.id !== id));
        if (accepted) {
            setFriends((prev) => [
                ...prev,
                { id: accepted.id, name: accepted.name, streak: 0, avatar: null },
            ]);
        }
        try {
            await api.post(ENDPOINTS.acceptRequest, { requestId: id });
        } catch (err) {
            console.log("Accept failed:", err.message);
            // Could roll back state here if you want strict consistency
        }
    };

    const handleReject = async (id) => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        try {
            await api.post(ENDPOINTS.rejectRequest, { requestId: id });
        } catch (err) {
            console.log("Reject failed:", err.message);
        }
    };

    const handleInvite = async (id) => {
        try {
            await api.post(ENDPOINTS.sendRequest, { userId: id });
            setSuggestions((prev) =>
                prev.map((s) => (s.id === id ? { ...s, invited: true } : s))
            );
        } catch (err) {
            console.log("Invite failed:", err.message);
        }
    };

    const initials = (name = "") =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

    const renderAvatar = (name) => (
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
    );

    const renderEmpty = (message) => {
        if (loading) return null;
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{message}</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    };

    const renderFriendCard = ({ item }) => (
        <View style={styles.card}>
            {renderAvatar(item.name)}
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>🔥 {item.streak ?? 0} day streak</Text>
            </View>
        </View>
    );

    const renderRequestCard = ({ item }) => (
        <View style={styles.card}>
            {renderAvatar(item.name)}
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>{item.mutual ?? 0} mutual friends</Text>
            </View>
            <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item.id)}
            >
                <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item.id)}
            >
                <Text style={styles.rejectText}>✕</Text>
            </TouchableOpacity>
        </View>
    );

    const renderInviteCard = ({ item }) => (
        <View style={styles.card}>
            {renderAvatar(item.name)}
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>{item.mutual ?? 0} mutual friends</Text>
            </View>
            <TouchableOpacity
                style={[styles.inviteBtn, item.invited && styles.inviteBtnDisabled]}
                onPress={() => !item.invited && handleInvite(item.id)}
                disabled={item.invited}
            >
                <Text style={styles.inviteText}>
                    {item.invited ? "Invited" : "Invite"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const refreshControl = (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
        />
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Friends</Text>

            <View style={styles.tabRow}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab && styles.tabTextActive,
                            ]}
                        >
                            {tab}
                            {tab === "Requests" && requests.length > 0
                                ? ` (${requests.length})`
                                : ""}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {(activeTab === "All Friends" || activeTab === "Invite") && (
                <TextInput
                    style={styles.searchInput}
                    placeholder={
                        activeTab === "Invite"
                            ? "Search people to invite..."
                            : "Search your friends..."
                    }
                    placeholderTextColor={COLORS.textFaint}
                    value={search}
                    onChangeText={setSearch}
                />
            )}

            {loading ? (
                <ActivityIndicator
                    size="large"
                    color={COLORS.accent}
                    style={{ marginTop: 60 }}
                />
            ) : (
                <>
                    {activeTab === "All Friends" && (
                        <FlatList
                            data={filteredFriends}
                            keyExtractor={(item) => item.id}
                            renderItem={renderFriendCard}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={renderEmpty(
                                "No friends yet — invite someone!"
                            )}
                            refreshControl={refreshControl}
                        />
                    )}

                    {activeTab === "Requests" && (
                        <FlatList
                            data={requests}
                            keyExtractor={(item) => item.id}
                            renderItem={renderRequestCard}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={renderEmpty("No pending friend requests")}
                            refreshControl={refreshControl}
                        />
                    )}

                    {activeTab === "Invite" && (
                        <FlatList
                            data={filteredSuggestions}
                            keyExtractor={(item) => item.id}
                            renderItem={renderInviteCard}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={renderEmpty("No suggestions right now")}
                            refreshControl={refreshControl}
                        />
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        paddingHorizontal: 16,
        paddingTop: 50,
    },
    header: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.white,
        marginBottom: 16,
    },
    tabRow: {
        flexDirection: "row",
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.accent,
    },
    tabText: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: "600",
    },
    tabTextActive: {
        color: COLORS.accent,
    },
    searchInput: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: COLORS.white,
        marginBottom: 14,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: {
        color: COLORS.accent,
        fontWeight: "700",
    },
    name: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "600",
    },
    subtext: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    acceptBtn: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 6,
    },
    acceptText: {
        color: COLORS.bg,
        fontWeight: "700",
        fontSize: 12,
    },
    rejectBtn: {
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    rejectText: {
        color: COLORS.textMuted,
        fontWeight: "700",
    },
    inviteBtn: {
        borderWidth: 1,
        borderColor: COLORS.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    inviteBtnDisabled: {
        borderColor: COLORS.border,
    },
    inviteText: {
        color: COLORS.accent,
        fontWeight: "700",
        fontSize: 12,
    },
    emptyState: {
        alignItems: "center",
        marginTop: 60,
    },
    emptyText: {
        color: COLORS.textFaint,
        fontSize: 14,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 6,
    },
});