import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import HeaderSearch from "../components/HeaderSearch";
import { useState } from "react";

export default function Search(){
    const nav = useRouter();
    const { from } = useLocalSearchParams();
    const [keyword, setKeyword] = useState("");

    const handleBack = () => {
        if (from === 'main') {
          nav.push('/'); // main 경로로
        } else if (from === 'calendar') {
            nav.push('/calendar');
            } else {
            nav.back(); // fallback
            }
        };

    return (
        <View style={styles.container}>
            <HeaderSearch 
                value={keyword} 
                onChangeText={setKeyword} 
                onBack={handleBack}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF9F4',
    },
});