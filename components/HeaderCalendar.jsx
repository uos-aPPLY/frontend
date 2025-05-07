import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useFonts, Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import { useRouter } from 'expo-router';
import AppLoading from 'expo-app-loading';
import IconButton from './IconButton';

export default function Header() {
    const nav = useRouter();
    const [isOn, setIsOn] = useState(false);

    const [fontsLoaded] = useFonts({
        Caveat_600SemiBold,
    });

    if (!fontsLoaded) {
        return <AppLoading />;
    }

    const toggleSwitch = () => setIsOn((prev) => !prev);

    return (
        <View style={styles.container}>
        <View style={styles.left}>
            <Image
            source={require('../assets/character/char2.png')}
            style={styles.char2}
            />
            <View style={styles.dateWrapper}>
            <Text style={styles.dateText}>2025.04.09</Text>
            <Text style={styles.dayText}>Wed</Text>
            </View>
            <TouchableOpacity onPress={toggleSwitch}>
            <Image
                source={
                isOn
                    ? require('../assets/icons/righton.png')
                    : require('../assets/icons/leftoff.png')
                }
                style={styles.toggleImage}
            />
            </TouchableOpacity>
        </View>

        <View style={styles.right}>
            <IconButton
            source={require('../assets/icons/brownsearchicon.png')}
            hsize={22}
            wsize={22}
            onPress={() => {nav.push('/search?from=calendar');}}
            />
        </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FCF9F4',
        width: '100%',
        height: 114,
        flexDirection: 'row',
        paddingHorizontal: 30,
        paddingTop: 45,
    },
    char2: {
        width: 40,
        height: 38,
        marginRight: 10,
    },
    dateWrapper: {
        flexDirection: 'column', 
        justifyContent: 'center',
    },
    dateText: {
        fontFamily: 'Caveat_600SemiBold',
        fontSize: 24,
        marginRight: 10,
        color: '#AC8B78',
        lineHeight: 20,
    },
    dayText: {
        fontFamily: 'Caveat_600SemiBold',
        fontSize: 20,
        color: '#AC8B78',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    toggleImage: {
        width: 26,
        height: 19,
        marginLeft: 10,
    },
});