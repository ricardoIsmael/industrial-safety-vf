"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, ShieldBan, KeyRound, MoreVertical, Pencil, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ... mock data ...
const CLIENTS = [
  { id: 1, name: "Empresa Minera S.A.", email: "contacto@minera.com", date: "2024-05-01", status: "Activo" },
  { id: 2, name: "Seguridad Industrial Lima", email: "ventas@silima.pe", date: "2024-05-02", status: "Activo" },
  { id: 3, name: "Construcciones Delta", email: "admin@delta.com", date: "2024-05-03", status: "Bloqueado" },
]

export default function StaffAndAccessPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'staff' | 'clients'>('staff')
  const [selectedArea, setSelectedArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEditSuccess, setShowEditSuccess] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [nameFilter, setNameFilter] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const [formData, setFormData] = useState({
    dni: '',
    name: '',
    lastName: '',
    email: '',
    cellphone: ''
  })

  // Función para asignar colores y nombres bonitos a los roles
  const getRoleBadge = (role: string) => {
    const r = role?.toUpperCase() || ''
    if (r.includes('ADMINISTRADOR')) return { label: 'Admin', class: 'text-amber-400 border-amber-400/30 bg-amber-400/10' }
    if (r.includes('GERENCIA')) return { label: 'Gerencia', class: 'text-purple-400 border-purple-400/30 bg-purple-400/10' }
    if (r.includes('JEFE_SEGURIDAD')) return { label: 'Jefatura', class: 'text-blue-400 border-blue-400/30 bg-blue-400/10' }
    if (r.includes('LOGISTICA')) return { label: 'Logística', class: 'text-orange-400 border-orange-400/30 bg-orange-400/10' }
    if (r.includes('MARKETING')) return { label: 'Marketing', class: 'text-pink-400 border-pink-400/30 bg-pink-400/10' }
    if (r.includes('TRABAJADOR')) return { label: 'Planta', class: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' }
    if (r.includes('INSTRUCTOR')) return { label: 'Instructor', class: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10' }
    if (r.includes('SOPORTE')) return { label: 'Soporte TI', class: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' }
    return { label: 'Usuario', class: 'text-slate-400 border-slate-400/30 bg-slate-400/10' }
  }

  // Cargar usuarios al entrar
  useEffect(() => {
    if (session) {
      fetchStaff()
    }
  }, [session])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/proxy/users")
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (err) {
      console.error("Error cargando staff:", err)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [roleFilter, nameFilter])

  // Email availability check (debounced 600ms)
  useEffect(() => {
    if (!formData.email || !formData.email.includes('@')) {
      setEmailStatus('idle')
      return
    }
    setEmailStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/proxy/users/by-email?email=${encodeURIComponent(formData.email)}`)
        setEmailStatus(res.ok ? 'taken' : 'available')
      } catch {
        setEmailStatus('idle')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [formData.email])

  // Filtrar la lista — siempre excluir ALUMNO
  const allFiltered = staffList.filter(s => {
    const role = s.role?.toUpperCase() || ''
    if (role.includes('ALUMNO')) return false
    if (roleFilter !== 'ALL' && !role.includes(roleFilter)) return false
    if (nameFilter && !`${s.name ?? ''} ${s.lastName ?? ''}`.toLowerCase().includes(nameFilter.toLowerCase())) return false
    return true
  })

  // Paginar la lista filtrada
  const totalPages = Math.ceil(allFiltered.length / itemsPerPage)
  const filteredStaff = allFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleEditClick = (staff: any) => {
    setEditingStaff(staff)
    setIsEditModalOpen(true)
  }

  const handleToggleStatus = async (staff: any) => {
    try {
      const response = await fetch(`/api/proxy/users/${staff.id}/toggle-status`, {
        method: "PATCH",
      })
      if (response.ok) {
        setShowEditSuccess(true)
        fetchStaff()
        setTimeout(() => setShowEditSuccess(false), 1000)
      } else {
        alert("Error al cambiar el estado del usuario.")
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err)
    }
  }


  const handleUpdateStaff = async () => {
    setLoading(true)
    try {
      const updatePayload = {
        name: editingStaff.name,
        lastName: editingStaff.lastName,
        dni: editingStaff.dni,
        cellphone: editingStaff.cellphone,
        role: editingStaff.role,
        urlPhoto: editingStaff.urlPhoto || ""
      }

      const response = await fetch(`/api/proxy/users/admin/${editingStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setShowEditSuccess(true)
        fetchStaff()
        setTimeout(() => setShowEditSuccess(false), 1000) // Desaparece en 1 segundo
      } else {
        const errorData = await response.json()
        alert(`Error al actualizar: ${errorData.message || "Verifique los datos"}`)
      }
    } catch (err) {
      console.error("Error al actualizar:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!formData.email || !selectedArea) {
      alert("Por favor completa los campos obligatorios")
      return
    }

    setLoading(true)
    try {
      // Mapeo EXACTO según tu captura de Keycloak
      const roleMap: Record<string, string> = {
        "Administrador": "ROLE_ADMINISTRADOR",
        "Gerencia General": "ROLE_GERENCIA_GENERAL",
        "Marketing": "ROLE_MARKETING",
        "Logística y Almacén": "ROLE_LOGISTICA_ALMACEN",
        "Empleado de Planta": "ROLE_TRABAJADOR",
        "Jefe de Seguridad": "ROLE_JEFE_SEGURIDAD",
        "Instructor": "ROLE_INSTRUCTOR",
        "Soporte TI": "ROLE_SOPORTE",
      }

      // Mapeo de rutas para el botón "Ir al Módulo"
      const pathMap: Record<string, string> = {
        "Administrador": "/admin",
        "Gerencia General": "/gerencia",
        "Marketing": "/marketing",
        "Logística y Almacén": "/logistica",
        "Empleado de Planta": "/trabajador",
        "Jefe de Seguridad": "/jefatura",
        "Instructor": "/instructor",
        "Soporte TI": "/soporte",
      }

      const payload = {
        ...formData,
        role: roleMap[selectedArea] || "ROLE_ALUMNO",
        password: "DefaultPass1!"
      }

      const response = await fetch("/api/proxy/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowSuccess(true)
        setFormData({ dni: '', name: '', lastName: '', email: '', cellphone: '' })
        fetchStaff()
        setTimeout(() => {
          setShowSuccess(false)
          setSelectedArea('')
        }, 3000)
      } else if (response.status === 409) {
        alert(`El correo "${formData.email}" ya está en uso. Ingresa un correo diferente.`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || error.message || "No se pudo registrar"}`)
      }
    } catch (err) {
      console.error("Error al registrar:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Modal de Éxito con Acceso Directo */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-96 border-success/50 bg-surface shadow-2xl shadow-success/20 animate-in zoom-in-95 duration-300">
            <CardContent className="pt-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center animate-bounce">
                <Plus className="w-8 h-8 text-success rotate-45" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">¡Registro Exitoso!</h3>
                <p className="text-sm text-muted">El personal ha sido vinculado a <strong>{selectedArea}</strong>.</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  className="bg-success hover:bg-success/90 text-white font-bold"
                  onClick={() => window.location.href = (selectedArea === 'Gerencia General' ? '/gerencia' : selectedArea === 'Logística y Almacén' ? '/logistica' : selectedArea === 'Jefe de Seguridad' ? '/jefatura' : '/admin')}
                >
                  Ir al Módulo de {selectedArea}
                </Button>
                <Button variant="ghost" onClick={() => setShowSuccess(false)}>
                  Continuar registrando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Éxito al Editar (Rápido) */}
      {showEditSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-64 border-success/50 bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            <CardContent className="py-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-success rotate-45" />
              </div>
              <p className="text-lg font-bold text-success">¡Cambio Exitoso!</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Edición */}
      {isEditModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg border-primary/30 bg-surface shadow-2xl">
            <CardHeader>
              <CardTitle>Editar Personal</CardTitle>
              <CardDescription>Modifica los datos de {editingStaff.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombres</label>
                  <Input
                    value={editingStaff.name ?? ""}
                    onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Apellidos</label>
                  <Input
                    value={editingStaff.lastName ?? ""}
                    onChange={(e) => setEditingStaff({...editingStaff, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">DNI</label>
                  <Input
                    value={editingStaff.dni ?? ""}
                    onChange={(e) => setEditingStaff({...editingStaff, dni: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input 
                    value={editingStaff.cellphone || ""} 
                    onChange={(e) => setEditingStaff({...editingStaff, cellphone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo Electrónico</label>
                <Input
                  value={editingStaff.email ?? ""}
                  onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateStaff} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff y Control de Acceso</h1>
          <p className="text-muted">Gestiona roles corporativos y supervisa clientes registrados.</p>
        </div>
        
        <div className="flex bg-surface-secondary rounded-lg p-1 border border-border">
          <button 
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'staff' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            Registro de Staff
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'clients' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            Auditoría de Clientes
          </button>
        </div>
      </div>

      {activeTab === 'staff' ? (
        <div className="space-y-6">
          <Card className="bg-surface/50 border-border">
            <CardHeader>
              <CardTitle>Registrar Nuevo Usuario / Staff</CardTitle>
              <CardDescription>Añade personal interno y asigna sus áreas correspondientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">DNI</label>
                  <Input name="dni" value={formData.dni} onChange={handleInputChange} placeholder="Ej. 74839201" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nombres</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej. Juan" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Apellidos</label>
                  <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Ej. Pérez" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Área a la que pertenece</label>
                  <select 
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  >
                    <option value="">Seleccione área...</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Gerencia General">Gerencia General</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Logística y Almacén">Logística y Almacén</option>
                    <option value="Empleado de Planta">Empleado de Planta</option>
                    <option value="Jefe de Seguridad">Jefe de Seguridad</option>
                    <option value="Instructor">Instructor</option>
                    <option value="Soporte TI">Soporte TI</option>
                  </select>
                </div>
                {selectedArea === 'Empleado de Planta' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-medium text-foreground">Sub-Área</label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                      <option value="">Seleccione sub-área...</option>
                      <option value="Mina">Mina</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Operaciones">Operaciones</option>
                      <option value="Seguridad">Seguridad</option>
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="juan.perez@empresa.com"
                    className={emailStatus === 'taken' ? 'border-danger focus:border-danger' : emailStatus === 'available' ? 'border-success focus:border-success' : ''}
                  />
                  {emailStatus === 'checking' && <p className="text-xs text-muted">Verificando disponibilidad...</p>}
                  {emailStatus === 'taken' && <p className="text-xs text-danger font-medium">Este correo ya está registrado.</p>}
                  {emailStatus === 'available' && <p className="text-xs text-success font-medium">Correo disponible.</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Teléfono</label>
                  <Input name="cellphone" type="tel" value={formData.cellphone} onChange={handleInputChange} placeholder="+51 987 654 321" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button className="gap-2" onClick={handleRegister} disabled={loading}>
                  {loading ? "Registrando..." : (
                    <>
                      <Plus className="w-4 h-4" />
                      Registrar Usuario
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface/50 border-border">
             <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 gap-4">
              <div>
                <CardTitle>Directorio de Staff</CardTitle>
                <CardDescription>Personal con acceso a los módulos internos de la plataforma.</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-surface-secondary/50 border-transparent rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="ALL">Todos los Roles</option>
                  <option value="ADMINISTRADOR">Administradores</option>
                  <option value="GERENCIA">Gerencia</option>
                  <option value="JEFE_SEGURIDAD">Jefatura</option>
                  <option value="LOGISTICA">Logística</option>
                  <option value="TRABAJADOR">Planta</option>
                </select>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
                  <Input
                    placeholder="Filtrar por nombre..."
                    className="pl-9 bg-surface-secondary/50 border-transparent focus:border-primary w-full"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border border-border/50">
                <Table>
                  <TableHeader className="bg-surface-secondary/30">
                    <TableRow>
                      <TableHead className="w-[120px]">DNI</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Área / Rol</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((staff) => {
                        const badge = getRoleBadge(staff.role);
                        return (
                          <TableRow key={staff.id} className="hover:bg-surface-secondary/20 transition-colors h-[72px]">
                            <TableCell className="font-mono text-xs text-muted">{staff.dni || "N/A"}</TableCell>
                            <TableCell className="font-medium text-foreground">{staff.name} {staff.lastName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${badge.class}`}>
                                {badge.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-medium">{staff.email}</div>
                              <div className="text-[10px] text-muted">{staff.cellphone || "Sin teléfono"}</div>
                            </TableCell>
                            <TableCell>
                              {staff.isActive !== false ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                  <span className="text-[11px] text-success font-medium">Activo</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                                  <span className="text-[11px] text-danger font-medium">Inactivo</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted hover:text-foreground hover:bg-surface-secondary">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-surface border-border">
                                  <DropdownMenuItem onClick={() => handleEditClick(staff)} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(staff)}
                                    className={`cursor-pointer ${staff.isActive !== false ? "text-danger focus:text-danger" : "text-success focus:text-success"}`}
                                  >
                                    {staff.isActive !== false
                                      ? <><ToggleLeft className="mr-2 h-4 w-4" /> Desactivar Cuenta</>
                                      : <><ToggleRight className="mr-2 h-4 w-4" /> Activar Cuenta</>
                                    }
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16 text-muted">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 opacity-20" />
                            <p>No se encontraron resultados para el filtro seleccionado.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Controles de Paginación */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted">
                  Mostrando <span className="text-foreground font-medium">{filteredStaff.length}</span> de <span className="text-foreground font-medium">{allFiltered.length}</span> registros
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-border hover:bg-surface-secondary"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "primary" : "ghost"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-border hover:bg-surface-secondary"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-surface/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle>Auditoría de Clientes</CardTitle>
              <CardDescription>Supervisa y gestiona los accesos de clientes auto-registrados.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
              <Input placeholder="Buscar cliente..." className="pl-9 bg-surface-secondary/50 border-transparent focus:border-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CLIENTS.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell className="text-muted">{client.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={client.status === 'Activo' ? 'text-success border-success/30 bg-success/10' : 'text-danger border-danger/30 bg-danger/10'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Resetear Contraseña">
                          <KeyRound className="h-4 w-4 text-muted hover:text-primary transition-colors" />
                        </Button>
                        <Button variant="ghost" size="icon" title={client.status === 'Activo' ? 'Bloquear Usuario' : 'Desbloquear Usuario'}>
                          <ShieldBan className={`h-4 w-4 transition-colors ${client.status === 'Activo' ? 'text-muted hover:text-danger' : 'text-danger hover:text-success'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
