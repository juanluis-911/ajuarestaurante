'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ToggleLeft, ToggleRight, X, ImageIcon } from 'lucide-react'
import type { Category, MenuItem } from '@/types/database'

type CategoryWithItems = Category & { menu_items: MenuItem[] }

interface MenuManagerProps {
  restaurantId: string
  initialCategories: CategoryWithItems[]
}

interface CategoryModalState {
  open: boolean
  mode: 'create' | 'edit'
  id?: string
  name: string
  description: string
}

interface ItemModalState {
  open: boolean
  mode: 'create' | 'edit'
  id?: string
  name: string
  description: string
  price: string
  is_active: boolean
  category_id: string
  image_url: string | null
  imageFile: File | null
}

export function MenuManager({ restaurantId, initialCategories }: MenuManagerProps) {
  const [categories, setCategories] = useState<CategoryWithItems[]>(initialCategories)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    initialCategories[0]?.id ?? null
  )

  const [catModal, setCatModal] = useState<CategoryModalState>({
    open: false, mode: 'create', name: '', description: '',
  })
  const [itemModal, setItemModal] = useState<ItemModalState>({
    open: false, mode: 'create', name: '', description: '', price: '', is_active: true,
    category_id: '', image_url: null, imageFile: null,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const selectedCat = categories.find(c => c.id === selectedCatId) ?? null

  // --- Category operations ---

  function openCreateCat() {
    setCatModal({ open: true, mode: 'create', name: '', description: '' })
  }

  function openEditCat(cat: Category) {
    setCatModal({ open: true, mode: 'edit', id: cat.id, name: cat.name, description: cat.description ?? '' })
  }

  async function saveCategory() {
    if (!catModal.name.trim()) { toast.error('El nombre es requerido'); return }

    if (catModal.mode === 'create') {
      const nextOrder = (categories[categories.length - 1]?.sort_order ?? 0) + 1
      const { data, error } = await supabase
        .from('categories')
        .insert({ restaurant_id: restaurantId, name: catModal.name.trim(), description: catModal.description || null, sort_order: nextOrder, is_active: true })
        .select()
        .single()
      if (error) { toast.error('Error al crear categoría'); return }
      setCategories(prev => [...prev, { ...data, menu_items: [] }])
      setSelectedCatId(data.id)
      toast.success('Categoría creada')
    } else {
      const { data, error } = await supabase
        .from('categories')
        .update({ name: catModal.name.trim(), description: catModal.description || null })
        .eq('id', catModal.id!)
        .select()
        .single()
      if (error) { toast.error('Error al actualizar categoría'); return }
      setCategories(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
      toast.success('Categoría actualizada')
    }
    setCatModal(m => ({ ...m, open: false }))
  }

  async function deleteCategory(cat: CategoryWithItems) {
    if (cat.menu_items.length > 0) {
      toast.error('Elimina los items de la categoría primero')
      return
    }
    if (!confirm(`¿Eliminar categoría "${cat.name}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) { toast.error('Error al eliminar'); return }
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    if (selectedCatId === cat.id) setSelectedCatId(categories.find(c => c.id !== cat.id)?.id ?? null)
    toast.success('Categoría eliminada')
  }

  async function moveCat(index: number, dir: -1 | 1) {
    const newCats = [...categories]
    const swapIdx = index + dir
    if (swapIdx < 0 || swapIdx >= newCats.length) return
    ;[newCats[index], newCats[swapIdx]] = [newCats[swapIdx], newCats[index]]
    const updated = newCats.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCategories(updated)
    await Promise.all(
      updated.map(c => supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', c.id))
    )
  }

  // --- Item operations ---

  function openCreateItem() {
    if (!selectedCatId) return
    setImagePreview(null)
    setItemModal({
      open: true, mode: 'create', name: '', description: '', price: '',
      is_active: true, category_id: selectedCatId, image_url: null, imageFile: null,
    })
  }

  function openEditItem(item: MenuItem) {
    setImagePreview(null)
    setItemModal({
      open: true, mode: 'edit', id: item.id,
      name: item.name, description: item.description ?? '',
      price: item.price.toFixed(2), is_active: item.is_active,
      category_id: item.category_id,
      image_url: item.image_url,
      imageFile: null,
    })
  }

  function closeItemModal() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setItemModal(m => ({ ...m, open: false, imageFile: null }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5 MB')
      return
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setItemModal(m => ({ ...m, imageFile: file }))
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setItemModal(m => ({ ...m, image_url: null, imageFile: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function saveItem() {
    if (!itemModal.name.trim()) { toast.error('El nombre es requerido'); return }
    const price = parseFloat(itemModal.price)
    if (isNaN(price) || price < 0) { toast.error('Precio inválido'); return }

    // Upload image if a new file was selected
    let finalImageUrl: string | null = itemModal.image_url
    if (itemModal.imageFile) {
      const ext = itemModal.imageFile.name.split('.').pop() ?? 'jpg'
      const path = `${restaurantId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, itemModal.imageFile, { upsert: true })
      if (uploadError) { toast.error('Error al subir imagen'); return }
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path)
      finalImageUrl = urlData.publicUrl
    }

    if (itemModal.mode === 'create') {
      const catItems = categories.find(c => c.id === itemModal.category_id)?.menu_items ?? []
      const nextOrder = (catItems[catItems.length - 1]?.sort_order ?? 0) + 1
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurantId,
          category_id: itemModal.category_id,
          name: itemModal.name.trim(),
          description: itemModal.description || null,
          price,
          is_active: itemModal.is_active,
          image_url: finalImageUrl,
          sort_order: nextOrder,
        })
        .select()
        .single()
      if (error) { toast.error('Error al crear item'); return }
      setCategories(prev => prev.map(c =>
        c.id === itemModal.category_id ? { ...c, menu_items: [...c.menu_items, data as MenuItem] } : c
      ))
      toast.success('Item creado')
    } else {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          name: itemModal.name.trim(),
          description: itemModal.description || null,
          price,
          is_active: itemModal.is_active,
          category_id: itemModal.category_id,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemModal.id!)
        .select()
        .single()
      if (error) { toast.error('Error al actualizar item'); return }
      setCategories(prev => prev.map(c => ({
        ...c,
        menu_items: c.menu_items.map(i => i.id === data.id ? (data as MenuItem) : i)
          .filter(i => i.category_id === c.id),
      })))
      if (data.category_id !== itemModal.category_id) {
        setCategories(prev => prev.map(c => {
          if (c.id === itemModal.category_id) return { ...c, menu_items: c.menu_items.filter(i => i.id !== data.id) }
          if (c.id === data.category_id) return { ...c, menu_items: [...c.menu_items, data as MenuItem] }
          return c
        }))
      }
      toast.success('Item actualizado')
    }
    closeItemModal()
  }

  async function deleteItem(item: MenuItem) {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (error) { toast.error('Error al eliminar'); return }
    setCategories(prev => prev.map(c => ({
      ...c,
      menu_items: c.menu_items.filter(i => i.id !== item.id),
    })))
    toast.success('Item eliminado')
  }

  async function toggleItem(item: MenuItem) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .select()
      .single()
    if (error) { toast.error('Error al actualizar'); return }
    setCategories(prev => prev.map(c => ({
      ...c,
      menu_items: c.menu_items.map(i => i.id === item.id ? (data as MenuItem) : i),
    })))
  }

  const currentPreview = imagePreview ?? itemModal.image_url

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left panel: categories */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Categorías</span>
          <button
            onClick={openCreateCat}
            className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors"
          >
            <Plus size={12} /> Nueva
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {categories.map((cat, idx) => (
            <li
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`flex items-center gap-1 px-3 py-2.5 cursor-pointer group transition-colors ${
                selectedCatId === cat.id ? 'bg-orange-50 border-r-2 border-orange-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col gap-0.5 mr-0.5">
                <button
                  onClick={e => { e.stopPropagation(); moveCat(idx, -1) }}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  disabled={idx === 0}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); moveCat(idx, 1) }}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  disabled={idx === categories.length - 1}
                >
                  <ChevronDown size={12} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${selectedCatId === cat.id ? 'text-orange-700' : 'text-gray-800'}`}>
                  {cat.name}
                </p>
                <p className="text-xs text-gray-400">{cat.menu_items.length} items</p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); openEditCat(cat) }}
                  className="p-1 text-gray-400 hover:text-orange-600"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteCategory(cat) }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-400">
              No hay categorías.<br />Crea la primera.
            </li>
          )}
        </ul>
      </aside>

      {/* Right panel: items */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              {selectedCat ? selectedCat.name : 'Selecciona una categoría'}
            </h2>
            {selectedCat && (
              <p className="text-xs text-gray-400 mt-0.5">{selectedCat.menu_items.length} items</p>
            )}
          </div>
          {selectedCat && (
            <button
              onClick={openCreateItem}
              className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> Nuevo Item
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedCat ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Selecciona una categoría para ver sus items
            </div>
          ) : selectedCat.menu_items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">No hay items en esta categoría.</p>
              <button onClick={openCreateItem} className="mt-2 text-orange-500 hover:underline text-sm">
                + Crear el primero
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 w-14"></th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Activo</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {selectedCat.menu_items.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon size={14} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{item.name}</td>
                    <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {item.description ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-800">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button onClick={() => toggleItem(item)} className="inline-flex">
                        {item.is_active
                          ? <ToggleRight size={20} className="text-orange-500" />
                          : <ToggleLeft size={20} className="text-gray-300" />
                        }
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditItem(item)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Category Modal */}
      {catModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {catModal.mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
              </h3>
              <button onClick={() => setCatModal(m => ({ ...m, open: false }))} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  autoFocus
                  type="text"
                  value={catModal.name}
                  onChange={e => setCatModal(m => ({ ...m, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ej. Tacos, Bebidas, Postres..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={catModal.description}
                  onChange={e => setCatModal(m => ({ ...m, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  placeholder="Descripción opcional..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setCatModal(m => ({ ...m, open: false }))}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCategory}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                {catModal.mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {itemModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">
                {itemModal.mode === 'create' ? 'Nuevo Item' : 'Editar Item'}
              </h3>
              <button onClick={closeItemModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  autoFocus
                  type="text"
                  value={itemModal.name}
                  onChange={e => setItemModal(m => ({ ...m, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Nombre del platillo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={itemModal.description}
                  onChange={e => setItemModal(m => ({ ...m, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  placeholder="Ingredientes, preparación..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemModal.price}
                    onChange={e => setItemModal(m => ({ ...m, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={itemModal.category_id}
                  onChange={e => setItemModal(m => ({ ...m, category_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {currentPreview ? (
                      <img
                        src={currentPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:border-orange-400 hover:text-orange-600 transition-colors"
                    >
                      {currentPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </button>
                    {currentPreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Quitar imagen
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">JPG, PNG o WebP · máx. 5 MB</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setItemModal(m => ({ ...m, is_active: !m.is_active }))}
                  className="inline-flex"
                >
                  {itemModal.is_active
                    ? <ToggleRight size={24} className="text-orange-500" />
                    : <ToggleLeft size={24} className="text-gray-300" />
                  }
                </button>
                <span className="text-sm text-gray-700">
                  {itemModal.is_active ? 'Activo (visible en menú)' : 'Inactivo (oculto)'}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={closeItemModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveItem}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                {itemModal.mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
