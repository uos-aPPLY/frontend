// src/components/HeaderSearch.jsx
import { Image, StyleSheet, View } from 'react-native';
import IconButton from './IconButton';

const HeaderSearch = ({  }) => {
    return (
    <View style={styles.all}>
        <View style={styles.container}>
            <View style={styles.left}>
                <Image
                    source={require('../../assets/character/char2.png')}
                    style={styles.char2}
                />
                <Image
                    source={require('../../assets/icons/whitelogo.png')}
                    style={styles.logo}
                />
            </View>
            <View style={styles.right}>
                <IconButton
                    source={require('../../assets/icons/whitesearchicon.png')}
                    size={22}
                    onPress={() => {}}
                />
            </View>
        </View>
    </View>
    );
    };

export default HeaderSearch;

const styles = StyleSheet.create({
    all: {
        backgroundColor: '#FCF9F4',
    },
    container: {
        height: 114,
        width: '100%',
        backgroundColor: '#E3A7AD',
        paddingHorizontal: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 45,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    char2: {
        width: 35,
        height: 35,
        marginRight: 10,
    },
    logo: {
        width: 100,
        height: 35,
    },
    });
