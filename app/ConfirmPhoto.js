import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';
import {useRouter} from 'expo-router';
import IconButton from '../components/IconButton';
import axios from 'axios';

export default function ConfirmPhoto({ onBack }) {
    const nav = useRouter();
    const [photoList, setPhotoList] = useState([]);
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzQ2NTkyODYxLCJleHAiOjE3NDY1OTY0NjF9.d0ojO-dAG2PEtE2KPJBoI9rTmLljo4QKA0Cpk88uyUs"

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/photos/selection/temp',{
                    headers: {
                      Authorization: `Bearer ${token}`, // 로그인 후 받은 JWT
                    },
                    withCredentials: true,
            });
                const urls = res.data.map(photo => photo.photoUrl); // photoUrl 배열 추출
                setPhotoList(urls);
            } catch (error) {
                console.error('임시 사진 불러오기 실패', error);
            }
            };
        
            fetchPhotos();
        }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton
                    source={require('../assets/icons/backicon.png')}
                    hsize={22}
                    wsize={22}
                    style={styles.back}
                    onPress={() => nav.push('/create')}
                />
                <Text style={styles.date}>원하는 일기 방식을 선택해주세요</Text>
                <View style={{ width: 24 }} /> {/* 오른쪽 여백 */}
            </View>

            <View style={styles.grid}>
                {photoList.map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.image} />
                ))}
            </View>

            <View style={styles.buttonRow}>
                <Button title="직접 쓰기" onPress={() => { /* TODO */ }} />
                <Button title="AI 생성 일기" onPress={() => { /* TODO */ }} />
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    header: {
        width: '100%',
        paddingHorizontal: 30,
        paddingTop: 75,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FCF9F4',
    },
    back: {
        fontSize: 24,
        color: '#a78c7b',
    },
    title: { fontSize: 16, textAlign: 'center', marginVertical: 10 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    image: {
        width: 100,
        height: 100,
        margin: 5,
        borderRadius: 8,
    },
    date: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#a78c7b',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        backgroundColor: '#FEE500',
        borderRadius: 8,
        padding: 10,
        width: '40%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    container: {
        flex: 1,
        backgroundColor: '#FCF9F4',
        padding: 20,
    },
    image: {
        width: 100,
        height: 100,
        margin: 5,
        borderRadius: 8,
    },
});