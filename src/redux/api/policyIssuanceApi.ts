//@ts-nocheck
import { apiSlice } from './apiSlice';

export const policyIssuanceApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPendingPolicyIssuances: builder.query({
            query: () => '/api/policy-issuance/pending',
            providesTags: ['PolicyIssuance'],
        }),
        updatePolicyIssuance: builder.mutation({
            query: ({ id, baseProductPolicies }) => ({
                url: `/api/policy-issuance/${id}`,
                method: 'PUT',
                body: { baseProductPolicies },
            }),
            invalidatesTags: ['PolicyIssuance'],
        }),
    }),
});

export const {
    useGetPendingPolicyIssuancesQuery,
    useUpdatePolicyIssuanceMutation
} = policyIssuanceApi;
