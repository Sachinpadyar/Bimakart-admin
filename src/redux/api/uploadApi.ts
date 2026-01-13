import { apiSlice } from './apiSlice';

export const uploadApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        uploadFile: builder.mutation({
            query: (formData) => ({
                url: '/api/upload',
                method: 'POST',
                body: formData,
            }),
        }),
    }),
});

export const { useUploadFileMutation } = uploadApi;
