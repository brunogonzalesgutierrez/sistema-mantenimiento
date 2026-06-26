from django.db import models


class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    nombre = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='usuarios')
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.email


class TipoEquipo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table = 'tipos_equipo'
        verbose_name = 'Tipo de equipo'
        verbose_name_plural = 'Tipos de equipo'

    def __str__(self):
        return self.nombre


class Ubicacion(models.Model):
    nombre = models.CharField(max_length=100)
    area = models.CharField(max_length=100, blank=True)
    piso = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'ubicaciones'
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'

    def __str__(self):
        return self.nombre


class Equipo(models.Model):
    ESTADO_CHOICES = [
        ('operativo', 'Operativo'),
        ('en_mantenimiento', 'En mantenimiento'),
        ('fuera_de_servicio', 'Fuera de servicio'),
        ('dado_de_baja', 'Dado de baja'),
    ]

    nombre = models.CharField(max_length=150)
    marca = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    numero_serie = models.CharField(max_length=100, unique=True, blank=True)
    tipo_equipo = models.ForeignKey(TipoEquipo, on_delete=models.PROTECT, related_name='equipos')
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.SET_NULL, null=True, related_name='equipos')
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default='operativo')
    fecha_adquisicion = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'equipos'
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'

    def __str__(self):
        return f'{self.nombre} - {self.numero_serie}'


class ProgramacionPreventiva(models.Model):
    tipo_equipo = models.ForeignKey(TipoEquipo, on_delete=models.CASCADE, related_name='programaciones')
    nombre_tarea = models.CharField(max_length=200)
    frecuencia_dias = models.PositiveIntegerField()
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table = 'programacion_preventiva'
        verbose_name = 'Programación preventiva'
        verbose_name_plural = 'Programaciones preventivas'

    def __str__(self):
        return f'{self.nombre_tarea} - cada {self.frecuencia_dias} días'


class MantenimientoPreventivo(models.Model):
    ESTADO_CHOICES = [
        ('programado', 'Programado'),
        ('en_proceso', 'En proceso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]

    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='mantenimientos_preventivos')
    tecnico = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='mantenimientos_realizados')
    fecha_programada = models.DateField()
    fecha_realizada = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='programado')
    observaciones = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mantenimientos_preventivos'
        verbose_name = 'Mantenimiento preventivo'
        verbose_name_plural = 'Mantenimientos preventivos'

    def __str__(self):
        return f'{self.equipo} - {self.fecha_programada}'


class OrdenTrabajo(models.Model):
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    ESTADO_CHOICES = [
        ('abierta', 'Abierta'),
        ('asignada', 'Asignada'),
        ('en_proceso', 'En proceso'),
        ('cerrada', 'Cerrada'),
        ('cancelada', 'Cancelada'),
    ]

    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='ordenes_trabajo')
    solicitante = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='ordenes_solicitadas')
    tecnico = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_asignadas')
    descripcion_falla = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='abierta')
    fecha_solicitud = models.DateField(auto_now_add=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_cierre = models.DateField(null=True, blank=True)
    tiempo_reparacion_min = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'ordenes_trabajo'
        verbose_name = 'Orden de trabajo'
        verbose_name_plural = 'Órdenes de trabajo'

    def __str__(self):
        return f'OT#{self.id} - {self.equipo}'


class ActividadMantenimiento(models.Model):
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='actividades')
    descripcion = models.TextField()
    tipo = models.CharField(max_length=100, blank=True)
    realizada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'actividades_mantenimiento'
        verbose_name = 'Actividad de mantenimiento'
        verbose_name_plural = 'Actividades de mantenimiento'

    def __str__(self):
        return f'Actividad OT#{self.orden_trabajo.id}'


class RepuestoUsado(models.Model):
    orden_trabajo = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='repuestos')
    nombre_repuesto = models.CharField(max_length=200)
    cantidad = models.PositiveIntegerField(default=1)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'repuestos_usados'
        verbose_name = 'Repuesto usado'
        verbose_name_plural = 'Repuestos usados'

    def __str__(self):
        return f'{self.nombre_repuesto} x{self.cantidad}'


class Alerta(models.Model):
    TIPO_CHOICES = [
        ('mantenimiento_proximo', 'Mantenimiento próximo'),
        ('equipo_sin_mantenimiento', 'Equipo sin mantenimiento'),
        ('orden_pendiente', 'Orden pendiente'),
    ]

    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='alertas')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    generada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alertas'
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'

    def __str__(self):
        return f'{self.tipo} - {self.equipo}'


class HistorialEstadoEquipo(models.Model):
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='historial_estados')
    estado_anterior = models.CharField(max_length=30)
    estado_nuevo = models.CharField(max_length=30)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    cambiado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'historial_estados_equipo'
        verbose_name = 'Historial de estado'
        verbose_name_plural = 'Historial de estados'

    def __str__(self):
        return f'{self.equipo} {self.estado_anterior} → {self.estado_nuevo}'


class Reporte(models.Model):
    TIPO_CHOICES = [
        ('equipos_por_estado', 'Equipos por estado'),
        ('historial_equipo', 'Historial por equipo'),
        ('carga_tecnico', 'Carga por técnico'),
        ('kpis', 'KPIs generales'),
    ]

    generado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    parametros_json = models.JSONField(default=dict, blank=True)
    archivo_url = models.CharField(max_length=500, blank=True)
    generado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reportes'
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'

    def __str__(self):
        return f'{self.tipo} - {self.generado_en.date()}'