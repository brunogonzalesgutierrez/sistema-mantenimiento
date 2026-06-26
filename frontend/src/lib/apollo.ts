import { GraphQLClient } from 'graphql-request'

const token = () => localStorage.getItem('token')

export const client = new GraphQLClient('http://localhost:8000/graphql/', {
  headers: () => ({
    authorization: token() ? `Bearer ${token()}` : '',
  }),
})