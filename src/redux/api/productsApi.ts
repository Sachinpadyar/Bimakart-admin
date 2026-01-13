import { apiSlice } from './apiSlice';

export const productsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query({
            query: () => '/api/products',
            providesTags: ['Products'],
        }),
        addProduct: builder.mutation({
            query: (newProduct) => ({
                url: '/api/products',
                method: 'POST',
                body: newProduct,
            }),
            invalidatesTags: ['Products'],
        }),
        updateProduct: builder.mutation({
            query: ({ id, ...updatedProduct }) => ({
                url: `/api/products/${id}`,
                method: 'PUT',
                body: updatedProduct,
            }),
            invalidatesTags: ['Products'],
        }),
        toggleProductStatus: builder.mutation({
            query: (id) => ({
                url: `/api/products/${id}/toggle-status`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Products'],
        }),
        getProductConfig: builder.query({
            query: (id) => `/api/products/${id}/config`,
        }),
    }),
});

export const {
    useGetProductsQuery,
    useAddProductMutation,
    useUpdateProductMutation,
    useToggleProductStatusMutation,
    useGetProductConfigQuery
} = productsApi;
