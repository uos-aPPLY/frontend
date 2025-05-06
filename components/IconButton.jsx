import { Image, Pressable, StyleSheet } from 'react-native';

const IconButton = ({ source, onPress, wsize = 24, hsize =24, style }) => {
    return (
        <Pressable onPress={onPress} style={[styles.button, style]}>
            <Image source={source} style={{ width: wsize, height: hsize }} resizeMode="contain" />
        </Pressable>
    );
};

export default IconButton;

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        outlineStyle: 'none',
    },
});
