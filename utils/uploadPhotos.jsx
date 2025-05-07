import axios from 'axios';

export const uploadPhotos = async (assets) => {
    const formData = new FormData();

    assets.forEach((asset, index) => {
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('files', {
        uri: asset.uri,
        name: `photo_${index}.${fileType}`,
        type: `image/${fileType}`,
        });
    });

    try {
        const res = await axios.post(
        'http://localhost:8080/api/photos/upload',
        formData,
        {
            headers: {
            'Content-Type': 'multipart/form-data',
            },
        }
        );
        console.log('업로드 성공:', res.data);
        return res.data;
    } catch (error) {
        console.error('업로드 중 에러:', error);
        throw error;
    }
};
