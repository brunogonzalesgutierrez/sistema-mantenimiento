import graphene
import sistema.schema as sistema_schema
import sistema.mutations as sistema_mutations


class Query(sistema_schema.Query, graphene.ObjectType):
    pass


class Mutation(sistema_mutations.Mutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)