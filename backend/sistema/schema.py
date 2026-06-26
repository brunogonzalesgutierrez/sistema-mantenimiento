import graphene
from graphene_django import DjangoObjectType
from .models import (
    Rol, Usuario, TipoEquipo, Ubicacion, Equipo,
    ProgramacionPreventiva, MantenimientoPreventivo,
    OrdenTrabajo, ActividadMantenimiento, RepuestoUsado,
    Alerta, HistorialEstadoEquipo, Reporte
)


class RolType(DjangoObjectType):
    class Meta:
        model = Rol
        fields = '__all__'


class UsuarioType(DjangoObjectType):
    class Meta:
        model = Usuario
        fields = '__all__'


class TipoEquipoType(DjangoObjectType):
    class Meta:
        model = TipoEquipo
        fields = '__all__'


class UbicacionType(DjangoObjectType):
    class Meta:
        model = Ubicacion
        fields = '__all__'


class EquipoType(DjangoObjectType):
    class Meta:
        model = Equipo
        fields = '__all__'


class ProgramacionPreventivaType(DjangoObjectType):
    class Meta:
        model = ProgramacionPreventiva
        fields = '__all__'


class MantenimientoPreventivoType(DjangoObjectType):
    class Meta:
        model = MantenimientoPreventivo
        fields = '__all__'


class OrdenTrabajoType(DjangoObjectType):
    class Meta:
        model = OrdenTrabajo
        fields = '__all__'


class ActividadMantenimientoType(DjangoObjectType):
    class Meta:
        model = ActividadMantenimiento
        fields = '__all__'


class RepuestoUsadoType(DjangoObjectType):
    class Meta:
        model = RepuestoUsado
        fields = '__all__'


class AlertaType(DjangoObjectType):
    class Meta:
        model = Alerta
        fields = '__all__'


class HistorialEstadoEquipoType(DjangoObjectType):
    class Meta:
        model = HistorialEstadoEquipo
        fields = '__all__'


class ReporteType(DjangoObjectType):
    class Meta:
        model = Reporte
        fields = '__all__'


class Query(graphene.ObjectType):
    # Roles
    roles = graphene.List(RolType)
    rol = graphene.Field(RolType, id=graphene.Int(required=True))

    # Usuarios
    usuarios = graphene.List(UsuarioType)
    usuario = graphene.Field(UsuarioType, id=graphene.Int(required=True))

    # Tipos de equipo
    tipos_equipo = graphene.List(TipoEquipoType)

    # Ubicaciones
    ubicaciones = graphene.List(UbicacionType)

    # Equipos
    equipos = graphene.List(EquipoType, estado=graphene.String())
    equipo = graphene.Field(EquipoType, id=graphene.Int(required=True))

    # Programacion preventiva
    programaciones_preventivas = graphene.List(ProgramacionPreventivaType)

    # Mantenimientos preventivos
    mantenimientos_preventivos = graphene.List(MantenimientoPreventivoType, estado=graphene.String())
    mantenimiento_preventivo = graphene.Field(MantenimientoPreventivoType, id=graphene.Int(required=True))

    # Ordenes de trabajo
    ordenes_trabajo = graphene.List(OrdenTrabajoType, estado=graphene.String(), prioridad=graphene.String())
    orden_trabajo = graphene.Field(OrdenTrabajoType, id=graphene.Int(required=True))

    # Alertas
    alertas = graphene.List(AlertaType, leida=graphene.Boolean())

    # Reportes
    reportes = graphene.List(ReporteType)

    # --- Resolvers ---
    def resolve_roles(root, info):
        return Rol.objects.all()

    def resolve_rol(root, info, id):
        return Rol.objects.get(pk=id)

    def resolve_usuarios(root, info):
        return Usuario.objects.select_related('rol').all()

    def resolve_usuario(root, info, id):
        return Usuario.objects.get(pk=id)

    def resolve_tipos_equipo(root, info):
        return TipoEquipo.objects.all()

    def resolve_ubicaciones(root, info):
        return Ubicacion.objects.all()

    def resolve_equipos(root, info, estado=None):
        qs = Equipo.objects.select_related('tipo_equipo', 'ubicacion').all()
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    def resolve_equipo(root, info, id):
        return Equipo.objects.get(pk=id)

    def resolve_programaciones_preventivas(root, info):
        return ProgramacionPreventiva.objects.select_related('tipo_equipo').all()

    def resolve_mantenimientos_preventivos(root, info, estado=None):
        qs = MantenimientoPreventivo.objects.select_related('equipo', 'tecnico').all()
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    def resolve_mantenimiento_preventivo(root, info, id):
        return MantenimientoPreventivo.objects.get(pk=id)

    def resolve_ordenes_trabajo(root, info, estado=None, prioridad=None):
        qs = OrdenTrabajo.objects.select_related('equipo', 'solicitante', 'tecnico').all()
        if estado:
            qs = qs.filter(estado=estado)
        if prioridad:
            qs = qs.filter(prioridad=prioridad)
        return qs

    def resolve_orden_trabajo(root, info, id):
        return OrdenTrabajo.objects.get(pk=id)

    def resolve_alertas(root, info, leida=None):
        qs = Alerta.objects.select_related('equipo').all()
        if leida is not None:
            qs = qs.filter(leida=leida)
        return qs

    def resolve_reportes(root, info):
        return Reporte.objects.select_related('generado_por').all()