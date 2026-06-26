import graphene
from .models import (
    Rol, Usuario, TipoEquipo, Ubicacion, Equipo,
    ProgramacionPreventiva, MantenimientoPreventivo,
    OrdenTrabajo, ActividadMantenimiento, RepuestoUsado,
    Alerta, HistorialEstadoEquipo, Reporte
)
from .schema import (
    RolType, UsuarioType, TipoEquipoType, UbicacionType, EquipoType,
    ProgramacionPreventivaType, MantenimientoPreventivoType,
    OrdenTrabajoType, ActividadMantenimientoType, RepuestoUsadoType,
    AlertaType, HistorialEstadoEquipoType, ReporteType
)

from .auth import generar_token, verificar_token


# ── ROL ──────────────────────────────────────────────
class CrearRol(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()

    rol = graphene.Field(RolType)

    def mutate(root, info, nombre, descripcion=''):
        rol = Rol.objects.create(nombre=nombre, descripcion=descripcion)
        return CrearRol(rol=rol)


class EliminarRol(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    ok = graphene.Boolean()

    def mutate(root, info, id):
        Rol.objects.filter(pk=id).delete()
        return EliminarRol(ok=True)


# ── USUARIO ───────────────────────────────────────────
class CrearUsuario(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        email = graphene.String(required=True)
        password_hash = graphene.String(required=True)
        rol_id = graphene.Int(required=True)

    usuario = graphene.Field(UsuarioType)

    def mutate(root, info, nombre, email, password_hash, rol_id):
        rol = Rol.objects.get(pk=rol_id)
        usuario = Usuario.objects.create(
            nombre=nombre,
            email=email,
            password_hash=password_hash,
            rol=rol
        )
        return CrearUsuario(usuario=usuario)


class EliminarUsuario(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    ok = graphene.Boolean()

    def mutate(root, info, id):
        Usuario.objects.filter(pk=id).delete()
        return EliminarUsuario(ok=True)


# ── TIPO EQUIPO ───────────────────────────────────────
class CrearTipoEquipo(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()

    tipo_equipo = graphene.Field(TipoEquipoType)

    def mutate(root, info, nombre, descripcion=''):
        tipo = TipoEquipo.objects.create(nombre=nombre, descripcion=descripcion)
        return CrearTipoEquipo(tipo_equipo=tipo)


# ── UBICACION ─────────────────────────────────────────
class CrearUbicacion(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        area = graphene.String()
        piso = graphene.String()

    ubicacion = graphene.Field(UbicacionType)

    def mutate(root, info, nombre, area='', piso=''):
        ubicacion = Ubicacion.objects.create(nombre=nombre, area=area, piso=piso)
        return CrearUbicacion(ubicacion=ubicacion)


# ── EQUIPO ────────────────────────────────────────────
class CrearEquipo(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        marca = graphene.String()
        modelo = graphene.String()
        numero_serie = graphene.String()
        tipo_equipo_id = graphene.Int(required=True)
        ubicacion_id = graphene.Int()
        estado = graphene.String()
        fecha_adquisicion = graphene.Date()

    equipo = graphene.Field(EquipoType)

    def mutate(root, info, nombre, tipo_equipo_id, marca='', modelo='',
               numero_serie='', ubicacion_id=None, estado='operativo',
               fecha_adquisicion=None):
        tipo = TipoEquipo.objects.get(pk=tipo_equipo_id)
        ubicacion = Ubicacion.objects.get(pk=ubicacion_id) if ubicacion_id else None
        equipo = Equipo.objects.create(
            nombre=nombre, marca=marca, modelo=modelo,
            numero_serie=numero_serie, tipo_equipo=tipo,
            ubicacion=ubicacion, estado=estado,
            fecha_adquisicion=fecha_adquisicion
        )
        return CrearEquipo(equipo=equipo)


class ActualizarEstadoEquipo(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        estado = graphene.String(required=True)
        usuario_id = graphene.Int(required=True)

    equipo = graphene.Field(EquipoType)

    def mutate(root, info, id, estado, usuario_id):
        equipo = Equipo.objects.get(pk=id)
        usuario = Usuario.objects.get(pk=usuario_id)
        HistorialEstadoEquipo.objects.create(
            equipo=equipo,
            estado_anterior=equipo.estado,
            estado_nuevo=estado,
            usuario=usuario
        )
        equipo.estado = estado
        equipo.save()
        return ActualizarEstadoEquipo(equipo=equipo)


class EliminarEquipo(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    ok = graphene.Boolean()

    def mutate(root, info, id):
        Equipo.objects.filter(pk=id).delete()
        return EliminarEquipo(ok=True)


# ── PROGRAMACION PREVENTIVA ───────────────────────────
class CrearProgramacionPreventiva(graphene.Mutation):
    class Arguments:
        tipo_equipo_id = graphene.Int(required=True)
        nombre_tarea = graphene.String(required=True)
        frecuencia_dias = graphene.Int(required=True)
        descripcion = graphene.String()

    programacion = graphene.Field(ProgramacionPreventivaType)

    def mutate(root, info, tipo_equipo_id, nombre_tarea, frecuencia_dias, descripcion=''):
        tipo = TipoEquipo.objects.get(pk=tipo_equipo_id)
        prog = ProgramacionPreventiva.objects.create(
            tipo_equipo=tipo,
            nombre_tarea=nombre_tarea,
            frecuencia_dias=frecuencia_dias,
            descripcion=descripcion
        )
        return CrearProgramacionPreventiva(programacion=prog)


# ── MANTENIMIENTO PREVENTIVO ──────────────────────────
class CrearMantenimientoPreventivo(graphene.Mutation):
    class Arguments:
        equipo_id = graphene.Int(required=True)
        tecnico_id = graphene.Int()
        fecha_programada = graphene.Date(required=True)
        observaciones = graphene.String()

    mantenimiento = graphene.Field(MantenimientoPreventivoType)

    def mutate(root, info, equipo_id, fecha_programada, tecnico_id=None, observaciones=''):
        equipo = Equipo.objects.get(pk=equipo_id)
        tecnico = Usuario.objects.get(pk=tecnico_id) if tecnico_id else None
        m = MantenimientoPreventivo.objects.create(
            equipo=equipo, tecnico=tecnico,
            fecha_programada=fecha_programada,
            observaciones=observaciones
        )
        return CrearMantenimientoPreventivo(mantenimiento=m)


class ActualizarMantenimientoPreventivo(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        estado = graphene.String()
        fecha_realizada = graphene.Date()
        observaciones = graphene.String()

    mantenimiento = graphene.Field(MantenimientoPreventivoType)

    def mutate(root, info, id, estado=None, fecha_realizada=None, observaciones=None):
        m = MantenimientoPreventivo.objects.get(pk=id)
        if estado:
            m.estado = estado
        if fecha_realizada:
            m.fecha_realizada = fecha_realizada
        if observaciones:
            m.observaciones = observaciones
        m.save()
        return ActualizarMantenimientoPreventivo(mantenimiento=m)


# ── ORDEN DE TRABAJO ──────────────────────────────────
class CrearOrdenTrabajo(graphene.Mutation):
    class Arguments:
        equipo_id = graphene.Int(required=True)
        solicitante_id = graphene.Int(required=True)
        descripcion_falla = graphene.String(required=True)
        prioridad = graphene.String()

    orden = graphene.Field(OrdenTrabajoType)

    def mutate(root, info, equipo_id, solicitante_id, descripcion_falla, prioridad='media'):
        equipo = Equipo.objects.get(pk=equipo_id)
        solicitante = Usuario.objects.get(pk=solicitante_id)
        orden = OrdenTrabajo.objects.create(
            equipo=equipo, solicitante=solicitante,
            descripcion_falla=descripcion_falla,
            prioridad=prioridad
        )
        return CrearOrdenTrabajo(orden=orden)


class AsignarTecnicoOrden(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        tecnico_id = graphene.Int(required=True)

    orden = graphene.Field(OrdenTrabajoType)

    def mutate(root, info, id, tecnico_id):
        orden = OrdenTrabajo.objects.get(pk=id)
        tecnico = Usuario.objects.get(pk=tecnico_id)
        orden.tecnico = tecnico
        orden.estado = 'asignada'
        orden.save()
        return AsignarTecnicoOrden(orden=orden)


class CerrarOrdenTrabajo(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        fecha_cierre = graphene.Date(required=True)
        tiempo_reparacion_min = graphene.Int()

    orden = graphene.Field(OrdenTrabajoType)

    def mutate(root, info, id, fecha_cierre, tiempo_reparacion_min=None):
        orden = OrdenTrabajo.objects.get(pk=id)
        orden.estado = 'cerrada'
        orden.fecha_cierre = fecha_cierre
        if tiempo_reparacion_min:
            orden.tiempo_reparacion_min = tiempo_reparacion_min
        orden.save()
        return CerrarOrdenTrabajo(orden=orden)


# ── ACTIVIDAD MANTENIMIENTO ───────────────────────────
class CrearActividadMantenimiento(graphene.Mutation):
    class Arguments:
        orden_trabajo_id = graphene.Int(required=True)
        descripcion = graphene.String(required=True)
        tipo = graphene.String()

    actividad = graphene.Field(ActividadMantenimientoType)

    def mutate(root, info, orden_trabajo_id, descripcion, tipo=''):
        orden = OrdenTrabajo.objects.get(pk=orden_trabajo_id)
        actividad = ActividadMantenimiento.objects.create(
            orden_trabajo=orden, descripcion=descripcion, tipo=tipo
        )
        return CrearActividadMantenimiento(actividad=actividad)


# ── REPUESTO USADO ────────────────────────────────────
class CrearRepuestoUsado(graphene.Mutation):
    class Arguments:
        orden_trabajo_id = graphene.Int(required=True)
        nombre_repuesto = graphene.String(required=True)
        cantidad = graphene.Int()
        costo_unitario = graphene.Float()

    repuesto = graphene.Field(RepuestoUsadoType)

    def mutate(root, info, orden_trabajo_id, nombre_repuesto, cantidad=1, costo_unitario=None):
        orden = OrdenTrabajo.objects.get(pk=orden_trabajo_id)
        repuesto = RepuestoUsado.objects.create(
            orden_trabajo=orden,
            nombre_repuesto=nombre_repuesto,
            cantidad=cantidad,
            costo_unitario=costo_unitario
        )
        return CrearRepuestoUsado(repuesto=repuesto)


# ── ALERTA ────────────────────────────────────────────
class MarcarAlertaLeida(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    alerta = graphene.Field(AlertaType)

    def mutate(root, info, id):
        alerta = Alerta.objects.get(pk=id)
        alerta.leida = True
        alerta.save()
        return MarcarAlertaLeida(alerta=alerta)


# ── AUTH ──────────────────────────────────────────────
class Login(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    usuario = graphene.Field(UsuarioType)
    error = graphene.String()

    def mutate(root, info, email, password):
        try:
            usuario = Usuario.objects.select_related('rol').get(email=email)
            if usuario.password_hash != password:
                return Login(error='Contraseña incorrecta')
            if not usuario.activo:
                return Login(error='Usuario inactivo')
            token = generar_token(usuario)
            return Login(token=token, usuario=usuario)
        except Usuario.DoesNotExist:
            return Login(error='Usuario no encontrado')


class CambiarPassword(graphene.Mutation):
    class Arguments:
        usuario_id = graphene.Int(required=True)
        password_actual = graphene.String(required=True)
        password_nuevo = graphene.String(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, usuario_id, password_actual, password_nuevo):
        try:
            usuario = Usuario.objects.get(pk=usuario_id)
            if usuario.password_hash != password_actual:
                return CambiarPassword(ok=False, error='Contraseña actual incorrecta')
            usuario.password_hash = password_nuevo
            usuario.save()
            return CambiarPassword(ok=True)
        except Usuario.DoesNotExist:
            return CambiarPassword(ok=False, error='Usuario no encontrado')






# ── MUTATION RAIZ ─────────────────────────────────────
class Mutation(graphene.ObjectType):
    # Roles
    crear_rol = CrearRol.Field()
    eliminar_rol = EliminarRol.Field()

    # Usuarios
    crear_usuario = CrearUsuario.Field()
    eliminar_usuario = EliminarUsuario.Field()

    # Tipos equipo
    crear_tipo_equipo = CrearTipoEquipo.Field()

    # Ubicaciones
    crear_ubicacion = CrearUbicacion.Field()

    # Equipos
    crear_equipo = CrearEquipo.Field()
    actualizar_estado_equipo = ActualizarEstadoEquipo.Field()
    eliminar_equipo = EliminarEquipo.Field()

    # Programacion preventiva
    crear_programacion_preventiva = CrearProgramacionPreventiva.Field()

    # Mantenimiento preventivo
    crear_mantenimiento_preventivo = CrearMantenimientoPreventivo.Field()
    actualizar_mantenimiento_preventivo = ActualizarMantenimientoPreventivo.Field()

    # Ordenes de trabajo
    crear_orden_trabajo = CrearOrdenTrabajo.Field()
    asignar_tecnico_orden = AsignarTecnicoOrden.Field()
    cerrar_orden_trabajo = CerrarOrdenTrabajo.Field()

    # Actividades
    crear_actividad_mantenimiento = CrearActividadMantenimiento.Field()

    # Repuestos
    crear_repuesto_usado = CrearRepuestoUsado.Field()

    # Alertas
    marcar_alerta_leida = MarcarAlertaLeida.Field()
    # Auth
    login = Login.Field()
    cambiar_password = CambiarPassword.Field()