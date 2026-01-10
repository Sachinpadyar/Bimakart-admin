import { apiSlice } from './apiSlice';

export const fieldsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createField: builder.mutation({
            query: (newField) => ({
                url: '/api/fields',
                method: 'POST',
                body: newField,
            }),
            invalidatesTags: ['Fields'],
        }),
        getFields: builder.query({
            query: () => '/api/fields',
            providesTags: ['Fields'],
        }),
        deleteField: builder.mutation({
            query: (id) => ({
                url: `/api/fields/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Fields'],
        }),
        updateField: builder.mutation({
            query: ({ id, ...updatedField }) => ({
                url: `/api/fields/${id}`,
                method: 'PUT',
                body: updatedField,
            }),
            invalidatesTags: ['Fields'],
        }),
    }),
});

export const { useCreateFieldMutation, useGetFieldsQuery, useDeleteFieldMutation, useUpdateFieldMutation } = fieldsApi;
