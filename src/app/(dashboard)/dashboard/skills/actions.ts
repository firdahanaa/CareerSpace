'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { skillFormSchema } from '@/lib/validation/skill'
import { revalidatePath } from 'next/cache'

export interface SkillActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  skillId?: string
}

/**
 * 1. Tambah Skill Baru (PRD 5.5)
 * name wajib dan unik per profil (tidak peka huruf besar/kecil)
 */
export async function createSkillAction(
  _prevState: SkillActionState | null,
  formData: FormData
): Promise<SkillActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      success: false,
      message: 'Profil administrator belum ditemukan. Harap lengkapi profil terlebih dahulu.',
    }
  }

  const name = formData.get('name')
  const category = formData.get('category')
  const proficiency = formData.get('proficiency')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const validation = skillFormSchema.safeParse({
    name,
    category,
    proficiency: proficiency === '' ? null : proficiency,
    published,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  // Cek duplikasi nama secara case-insensitive untuk profil ini
  const existingSkill = await db.skill.findFirst({
    where: {
      profileId: profile.id,
      name: { equals: valid.name, mode: 'insensitive' },
    },
  })

  if (existingSkill) {
    return {
      success: false,
      message: 'Nama skill sudah terdaftar.',
      fieldErrors: {
        name: [`Skill "${valid.name}" sudah ada dalam daftar Anda (tidak peka huruf besar/kecil).`],
      },
    }
  }

  // Hitung sortOrder berikutnya dalam kategori ini
  const maxOrder = await db.skill.aggregate({
    where: {
      profileId: profile.id,
      category: valid.category,
    },
    _max: { sortOrder: true },
  })
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

  try {
    const newSkill = await db.skill.create({
      data: {
        profileId: profile.id,
        name: valid.name,
        category: valid.category,
        proficiency: valid.proficiency,
        published: valid.published,
        sortOrder: nextOrder,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/skills')
    revalidatePath('/dashboard/projects')
    return {
      success: true,
      message: `Skill "${newSkill.name}" berhasil ditambahkan.`,
      skillId: newSkill.id,
    }
  } catch (error) {
    console.error('Error creating skill:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menyimpan skill ke database.',
    }
  }
}

/**
 * 2. Update Skill
 */
export async function updateSkillAction(
  id: string,
  _prevState: SkillActionState | null,
  formData: FormData
): Promise<SkillActionState> {
  const admin = await requireAdmin()

  const existingSkill = await db.skill.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
  })

  if (!existingSkill) {
    return {
      success: false,
      message: 'Skill tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.',
    }
  }

  const name = formData.get('name')
  const category = formData.get('category')
  const proficiency = formData.get('proficiency')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const validation = skillFormSchema.safeParse({
    name,
    category,
    proficiency: proficiency === '' ? null : proficiency,
    published,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  // Cek duplikasi nama secara case-insensitive selain skill ini
  const duplicate = await db.skill.findFirst({
    where: {
      profileId: existingSkill.profileId,
      name: { equals: valid.name, mode: 'insensitive' },
      NOT: { id },
    },
  })

  if (duplicate) {
    return {
      success: false,
      message: 'Nama skill sudah terdaftar.',
      fieldErrors: {
        name: [`Skill "${valid.name}" sudah digunakan oleh entri lain.`],
      },
    }
  }

  // Jika kategori berubah, pindahkan ke urutan paling belakang pada kategori baru
  let sortOrderToSet = existingSkill.sortOrder
  if (existingSkill.category !== valid.category) {
    const maxOrder = await db.skill.aggregate({
      where: {
        profileId: existingSkill.profileId,
        category: valid.category,
      },
      _max: { sortOrder: true },
    })
    sortOrderToSet = (maxOrder._max.sortOrder ?? -1) + 1
  }

  try {
    await db.skill.update({
      where: { id },
      data: {
        name: valid.name,
        category: valid.category,
        proficiency: valid.proficiency,
        published: valid.published,
        sortOrder: sortOrderToSet,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/skills')
    revalidatePath('/dashboard/projects')
    return {
      success: true,
      message: `Skill "${valid.name}" berhasil diperbarui.`,
      skillId: id,
    }
  } catch (error) {
    console.error('Error updating skill:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui skill.',
    }
  }
}

/**
 * 3. Toggle Status Published Skill langsung dari daftar
 */
export async function toggleSkillPublishedAction(id: string): Promise<SkillActionState> {
  const admin = await requireAdmin()

  const skill = await db.skill.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, name: true, published: true },
  })

  if (!skill) {
    return { success: false, message: 'Skill tidak ditemukan.' }
  }

  const nextPublished = !skill.published

  await db.skill.update({
    where: { id },
    data: { published: nextPublished },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/skills')
  return {
    success: true,
    message: nextPublished
      ? `Skill "${skill.name}" dipublikasikan ke portofolio.`
      : `Skill "${skill.name}" diatur menjadi privat.`,
  }
}

/**
 * 4. Pengurutan Naik/Turun DALAM Kategori (DATA-06)
 */
export async function reorderSkillAction(
  id: string,
  direction: 'up' | 'down'
): Promise<SkillActionState> {
  const admin = await requireAdmin()

  const targetSkill = await db.skill.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, profileId: true, category: true, sortOrder: true },
  })

  if (!targetSkill) {
    return { success: false, message: 'Skill tidak ditemukan.' }
  }

  // Ambil semua skill dalam KATEGORI YANG SAMA
  const categorySkills = await db.skill.findMany({
    where: {
      profileId: targetSkill.profileId,
      category: targetSkill.category,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, sortOrder: true },
  })

  const currentIndex = categorySkills.findIndex((s) => s.id === id)
  if (currentIndex === -1) {
    return { success: false, message: 'Skill tidak ditemukan dalam kategori.' }
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= categorySkills.length) {
    return { success: true, message: 'Posisi tidak berubah.' }
  }

  const currentItem = categorySkills[currentIndex]
  const targetItem = categorySkills[targetIndex]

  // Normalisasi urutan jika terdapat nilai sortOrder kembar
  if (currentItem.sortOrder === targetItem.sortOrder) {
    await db.$transaction(
      categorySkills.map((s, index) => {
        let order = index
        if (index === currentIndex) order = targetIndex
        else if (index === targetIndex) order = currentIndex

        return db.skill.update({
          where: { id: s.id },
          data: { sortOrder: order },
        })
      })
    )
  } else {
    // Tukar sortOrder
    await db.$transaction([
      db.skill.update({
        where: { id: currentItem.id },
        data: { sortOrder: targetItem.sortOrder },
      }),
      db.skill.update({
        where: { id: targetItem.id },
        data: { sortOrder: currentItem.sortOrder },
      }),
    ])
  }

  revalidatePath('/dashboard/skills')
  return { success: true, message: 'Urutan skill berhasil diperbarui.' }
}

/**
 * 5. Hapus Skill (DATA-07 & PRD 5.5)
 * Jika dipakai CV: tolak dengan pesan jelas.
 * Jika dipakai Project/Experience: relasi many-to-many otomatis dilepas.
 */
export async function deleteSkillAction(id: string): Promise<SkillActionState> {
  const admin = await requireAdmin()

  const skill = await db.skill.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    include: {
      _count: {
        select: {
          cvSelections: true,
          projects: true,
          experiences: true,
        },
      },
    },
  })

  if (!skill) {
    return { success: false, message: 'Skill tidak ditemukan.' }
  }

  // Pengecekan keterkaitan CV
  if (skill._count.cvSelections > 0) {
    return {
      success: false,
      message: `Skill "${skill.name}" tidak dapat dihapus karena sedang digunakan dalam ${skill._count.cvSelections} konfigurasi CV. Lepaskan skill dari CV tersebut terlebih dahulu.`,
    }
  }

  try {
    // Penghapusan skill akan otomatis mencabut relasi ProjectSkill & ExperienceSkill karena onDelete: Cascade
    await db.skill.delete({
      where: { id },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/skills')
    revalidatePath('/dashboard/projects')
    return {
      success: true,
      message: `Skill "${skill.name}" berhasil dihapus.`,
    }
  } catch (error) {
    console.error('Error deleting skill:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus skill.',
    }
  }
}
