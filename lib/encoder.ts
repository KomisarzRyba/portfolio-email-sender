export const webSafeBase64Encode = (data: string) => {
	return btoa(data).replace(/\+/g, '-').replace(/\//g, '_');
};
