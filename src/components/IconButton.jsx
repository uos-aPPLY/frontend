import { Image, Pressable, StyleSheet } from 'react-native';

const IconButton = ({ source, onPress, size = 24, style }) => {
    return (
        <Pressable onPress={onPress} style={[styles.button, style]}>
            <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
        </Pressable>
    );
};

export default IconButton;

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
