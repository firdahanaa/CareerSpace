import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export type RecordType = 'PROJECT' | 'EXPERIENCE' | 'EDUCATION' | 'CERTIFICATION' | 'CV'

export interface RecentUpdateItem {
  id: string
  type: RecordType
  title: string
  subtitle?: string
  updatedAt: Date
  published: boolean
  href: string
}

export interface DashboardOverviewData {
  admin: {
    id: string
    email: string
  }
  profile: {
    id: string
    fullName: string
    headline: string
  } | null
  counts: {
    projects: { total: number; published: number }
    experiences: { total: number; published: number }
    education: { total: number; published: number }
    certifications: { total: number; published: number }
    skills: { total: number; published: number }
    cvs: { total: number; published: number }
  }
  portfolio: {
    slug: string
    isPublished: boolean
  } | null
  recentUpdates: RecentUpdateItem[]
}

/**
 * Mengambil data ringkasan untuk halaman Dashboard Overview (DASH-01, DASH-02, DASH-03).
 * Wajib memanggil requireAdmin() untuk validasi sesi server-side.
 */
export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  const admin = await requireAdmin()

  // Ambil profil administrator
  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: {
      id: true,
      fullName: true,
      headline: true,
    },
  })

  if (!profile) {
    return {
      admin: {
        id: admin.id ?? '',
        email: admin.email ?? '',
      },
      profile: null,
      counts: {
        projects: { total: 0, published: 0 },
        experiences: { total: 0, published: 0 },
        education: { total: 0, published: 0 },
        certifications: { total: 0, published: 0 },
        skills: { total: 0, published: 0 },
        cvs: { total: 0, published: 0 },
      },
      portfolio: null,
      recentUpdates: [],
    }
  }

  // Hitung jumlah data karier & status publikasi (DASH-01)
  const [
    totalProjects,
    publishedProjects,
    totalExperiences,
    publishedExperiences,
    totalEducation,
    publishedEducation,
    totalCertifications,
    publishedCertifications,
    totalSkills,
    publishedSkills,
    totalCvs,
    publishedCvs,
    portfolioSettings,
  ] = await Promise.all([
    db.project.count({ where: { profileId: profile.id } }),
    db.project.count({ where: { profileId: profile.id, published: true } }),
    db.experience.count({ where: { profileId: profile.id } }),
    db.experience.count({ where: { profileId: profile.id, published: true } }),
    db.education.count({ where: { profileId: profile.id } }),
    db.education.count({ where: { profileId: profile.id, published: true } }),
    db.certification.count({ where: { profileId: profile.id } }),
    db.certification.count({ where: { profileId: profile.id, published: true } }),
    db.skill.count({ where: { profileId: profile.id } }),
    db.skill.count({ where: { profileId: profile.id, published: true } }),
    db.cvConfig.count({ where: { profileId: profile.id } }),
    db.cvConfig.count({ where: { profileId: profile.id, published: true } }),
    db.portfolioSettings.findUnique({
      where: { profileId: profile.id },
      select: { slug: true, isPublished: true },
    }),
  ])

  // Ambil kandidat record yang baru saja diubah untuk 5 record terakhir
  const [recentProjects, recentExperiences, recentEducations, recentCertifications, recentCvs] =
    await Promise.all([
      db.project.findMany({
        where: { profileId: profile.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, updatedAt: true, published: true, slug: true },
      }),
      db.experience.findMany({
        where: { profileId: profile.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, position: true, organization: true, updatedAt: true, published: true },
      }),
      db.education.findMany({
        where: { profileId: profile.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, institution: true, degree: true, updatedAt: true, published: true },
      }),
      db.certification.findMany({
        where: { profileId: profile.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, issuer: true, updatedAt: true, published: true },
      }),
      db.cvConfig.findMany({
        where: { profileId: profile.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, targetRole: true, updatedAt: true, published: true },
      }),
    ])

  const candidates: RecentUpdateItem[] = [
    ...recentProjects.map((p) => ({
      id: p.id,
      type: 'PROJECT' as const,
      title: p.title,
      subtitle: p.slug,
      updatedAt: p.updatedAt,
      published: p.published,
      href: `/dashboard/projects`,
    })),
    ...recentExperiences.map((e) => ({
      id: e.id,
      type: 'EXPERIENCE' as const,
      title: e.position,
      subtitle: e.organization,
      updatedAt: e.updatedAt,
      published: e.published,
      href: `/dashboard/experience`,
    })),
    ...recentEducations.map((ed) => ({
      id: ed.id,
      type: 'EDUCATION' as const,
      title: ed.institution,
      subtitle: ed.degree ?? undefined,
      updatedAt: ed.updatedAt,
      published: ed.published,
      href: `/dashboard/education`,
    })),
    ...recentCertifications.map((c) => ({
      id: c.id,
      type: 'CERTIFICATION' as const,
      title: c.title,
      subtitle: c.issuer ?? undefined,
      updatedAt: c.updatedAt,
      published: c.published,
      href: `/dashboard/certifications`,
    })),
    ...recentCvs.map((cv) => ({
      id: cv.id,
      type: 'CV' as const,
      title: cv.name,
      subtitle: cv.targetRole,
      updatedAt: cv.updatedAt,
      published: cv.published,
      href: `/dashboard/cvs`,
    })),
  ]

  // Urutkan berdasarkan updatedAt descending dan ambil 5 teratas
  const recentUpdates = candidates
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5)

  return {
    admin: {
      id: admin.id ?? '',
      email: admin.email ?? '',
    },
    profile,
    counts: {
      projects: { total: totalProjects, published: publishedProjects },
      experiences: { total: totalExperiences, published: publishedExperiences },
      education: { total: totalEducation, published: publishedEducation },
      certifications: { total: totalCertifications, published: publishedCertifications },
      skills: { total: totalSkills, published: publishedSkills },
      cvs: { total: totalCvs, published: publishedCvs },
    },
    portfolio: portfolioSettings,
    recentUpdates,
  }
}

export interface AdminProfileDataResult {
  adminEmail: string
  profile: {
    id: string
    fullName: string
    headline: string
    summary: string | null
    photoUrl: string | null
    email: string | null
    phone: string | null
    location: string | null
    linkedinUrl: string | null
    githubUrl: string | null
    otherLinks: unknown
  } | null
  settings: {
    id: string
    slug: string
    isPublished: boolean
    showEmail: boolean
    showPhone: boolean
    showLocation: boolean
    showLinkedin: boolean
    showGithub: boolean
  } | null
}

/**
 * Mengambil data profil dan pengaturan portofolio untuk form /dashboard/profile.
 * Memeriksa sesi via requireAdmin().
 */
export async function getAdminProfileData(): Promise<AdminProfileDataResult> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    include: {
      settings: true,
    },
  })

  return {
    adminEmail: admin.email ?? '',
    profile: profile
      ? {
          id: profile.id,
          fullName: profile.fullName,
          headline: profile.headline,
          summary: profile.summary,
          photoUrl: profile.photoUrl,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          linkedinUrl: profile.linkedinUrl,
          githubUrl: profile.githubUrl,
          otherLinks: profile.otherLinks,
        }
      : null,
    settings: profile?.settings ?? null,
  }
}

export interface AdminProjectListItem {
  id: string
  slug: string
  title: string
  shortSummary: string
  projectType: string | null
  startDate: Date | null
  endDate: Date | null
  isOngoing: boolean
  technologies: string[]
  coverImageUrl: string | null
  featured: boolean
  published: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  skills: {
    skill: {
      id: string
      name: string
      category: string
    }
  }[]
  cvSelectionsCount: number
}

export interface AdminProjectsResult {
  projects: AdminProjectListItem[]
  totalCount: number
  publishedCount: number
  privateCount: number
  featuredCount: number
  profileId: string | null
}

export interface GetAdminProjectsOptions {
  search?: string
  status?: 'all' | 'published' | 'private' | 'featured'
}

/**
 * Mengambil daftar proyek untuk halaman /dashboard/projects (DATA-01..07)
 */
export async function getAdminProjects(
  options: GetAdminProjectsOptions = {}
): Promise<AdminProjectsResult> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      projects: [],
      totalCount: 0,
      publishedCount: 0,
      privateCount: 0,
      featuredCount: 0,
      profileId: null,
    }
  }

  // Hitung statistik
  const [totalCount, publishedCount, privateCount, featuredCount] = await Promise.all([
    db.project.count({ where: { profileId: profile.id } }),
    db.project.count({ where: { profileId: profile.id, published: true } }),
    db.project.count({ where: { profileId: profile.id, published: false } }),
    db.project.count({ where: { profileId: profile.id, featured: true } }),
  ])

  // Filter kondisi
  const whereClause: Record<string, unknown> = {
    profileId: profile.id,
  }

  if (options.status === 'published') {
    whereClause.published = true
  } else if (options.status === 'private') {
    whereClause.published = false
  } else if (options.status === 'featured') {
    whereClause.featured = true
  }

  if (options.search && options.search.trim()) {
    const term = options.search.trim()
    whereClause.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { shortSummary: { contains: term, mode: 'insensitive' } },
      { technologies: { has: term } },
    ]
  }

  const rawProjects = await db.project.findMany({
    where: whereClause,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      skills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          cvSelections: true,
        },
      },
    },
  })

  const projects: AdminProjectListItem[] = rawProjects.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortSummary: p.shortSummary,
    projectType: p.projectType,
    startDate: p.startDate,
    endDate: p.endDate,
    isOngoing: p.isOngoing,
    technologies: p.technologies,
    coverImageUrl: p.coverImageUrl,
    featured: p.featured,
    published: p.published,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    skills: p.skills,
    cvSelectionsCount: p._count.cvSelections,
  }))

  return {
    projects,
    totalCount,
    publishedCount,
    privateCount,
    featuredCount,
    profileId: profile.id,
  }
}

/**
 * Mengambil satu proyek untuk form edit /dashboard/projects/[id]/edit
 */
export async function getAdminProjectById(id: string) {
  const admin = await requireAdmin()

  const project = await db.project.findFirst({
    where: {
      id,
      profile: {
        administratorId: admin.id,
      },
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      _count: {
        select: {
          cvSelections: true,
        },
      },
    },
  })

  return project
}

/**
 * Mengambil daftar skill milik profile untuk multi-select di form project
 */
export async function getAdminSkillsForProfile() {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) return []

  return db.skill.findMany({
    where: { profileId: profile.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
      proficiency: true,
    },
  })
}

export interface AdminSkillListItem {
  id: string
  name: string
  category: string
  proficiency: string | null
  published: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  projectsCount: number
  experiencesCount: number
  cvSelectionsCount: number
}

export interface AdminSkillsGroup {
  category: string
  label: string
  skills: AdminSkillListItem[]
}

export interface AdminSkillsOverviewResult {
  groups: AdminSkillsGroup[]
  totalSkills: number
  publishedSkills: number
  privateSkills: number
}

const CATEGORY_ORDER: string[] = [
  'TECHNICAL',
  'ANALYTICAL',
  'BUSINESS',
  'INTERPERSONAL',
  'LANGUAGE',
  'OTHER',
]

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: 'Teknis (Technical)',
  ANALYTICAL: 'Analitis (Analytical)',
  BUSINESS: 'Bisnis & Manajemen (Business)',
  INTERPERSONAL: 'Interpersonal & Komunikasi',
  LANGUAGE: 'Bahasa (Language)',
  OTHER: 'Lainnya (Other)',
}

/**
 * Mengambil seluruh skill yang dikelompokkan per kategori untuk /dashboard/skills
 */
export async function getAdminSkillsGroupedByCategory(): Promise<AdminSkillsOverviewResult> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      groups: [],
      totalSkills: 0,
      publishedSkills: 0,
      privateSkills: 0,
    }
  }

  const rawSkills = await db.skill.findMany({
    where: { profileId: profile.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: {
        select: {
          projects: true,
          experiences: true,
          cvSelections: true,
        },
      },
    },
  })

  let publishedCount = 0
  let privateCount = 0

  // Kelompokkan per kategori
  const groupedMap: Record<string, AdminSkillListItem[]> = {}
  for (const cat of CATEGORY_ORDER) {
    groupedMap[cat] = []
  }

  for (const s of rawSkills) {
    if (s.published) publishedCount++
    else privateCount++

    const item: AdminSkillListItem = {
      id: s.id,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      published: s.published,
      sortOrder: s.sortOrder,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      projectsCount: s._count.projects,
      experiencesCount: s._count.experiences,
      cvSelectionsCount: s._count.cvSelections,
    }

    if (!groupedMap[s.category]) {
      groupedMap[s.category] = []
    }
    groupedMap[s.category].push(item)
  }

  const groups: AdminSkillsGroup[] = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    skills: groupedMap[cat] || [],
  }))

  return {
    groups,
    totalSkills: rawSkills.length,
    publishedSkills: publishedCount,
    privateSkills: privateCount,
  }
}

export interface AdminExperienceListItem {
  id: string
  organization: string
  position: string
  category: string
  location: string | null
  startDate: Date | null
  endDate: Date | null
  isCurrent: boolean
  description: string | null
  responsibilities: string[]
  achievements: string[]
  published: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  skills: {
    skill: {
      id: string
      name: string
      category: string
    }
  }[]
  cvSelectionsCount: number
}

export interface AdminExperiencesResult {
  experiences: AdminExperienceListItem[]
  totalCount: number
  publishedCount: number
  privateCount: number
  categoryCounts: Record<string, number>
  profileId: string | null
}

export interface GetAdminExperiencesOptions {
  search?: string
  category?: string
  status?: 'all' | 'published' | 'private'
}

/**
 * Mengambil daftar pengalaman kerja/organisasi untuk /dashboard/experience
 */
export async function getAdminExperiences(
  options: GetAdminExperiencesOptions = {}
): Promise<AdminExperiencesResult> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      experiences: [],
      totalCount: 0,
      publishedCount: 0,
      privateCount: 0,
      categoryCounts: {},
      profileId: null,
    }
  }

  // Hitung total dan statistik
  const [totalCount, publishedCount, privateCount, employmentCount, internshipCount, orgCount, volCount, freelanceCount] =
    await Promise.all([
      db.experience.count({ where: { profileId: profile.id } }),
      db.experience.count({ where: { profileId: profile.id, published: true } }),
      db.experience.count({ where: { profileId: profile.id, published: false } }),
      db.experience.count({ where: { profileId: profile.id, category: 'EMPLOYMENT' } }),
      db.experience.count({ where: { profileId: profile.id, category: 'INTERNSHIP' } }),
      db.experience.count({ where: { profileId: profile.id, category: 'ORGANIZATION' } }),
      db.experience.count({ where: { profileId: profile.id, category: 'VOLUNTEERING' } }),
      db.experience.count({ where: { profileId: profile.id, category: 'FREELANCE' } }),
    ])

  const categoryCounts: Record<string, number> = {
    ALL: totalCount,
    EMPLOYMENT: employmentCount,
    INTERNSHIP: internshipCount,
    ORGANIZATION: orgCount,
    VOLUNTEERING: volCount,
    FREELANCE: freelanceCount,
  }

  // Filter conditions
  const whereClause: Record<string, unknown> = {
    profileId: profile.id,
  }

  if (options.category && options.category !== 'ALL') {
    whereClause.category = options.category
  }

  if (options.status === 'published') {
    whereClause.published = true
  } else if (options.status === 'private') {
    whereClause.published = false
  }

  if (options.search && options.search.trim()) {
    const term = options.search.trim()
    whereClause.OR = [
      { organization: { contains: term, mode: 'insensitive' } },
      { position: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { location: { contains: term, mode: 'insensitive' } },
    ]
  }

  const rawExperiences = await db.experience.findMany({
    where: whereClause,
    orderBy: [
      { sortOrder: 'asc' },
      { startDate: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      skills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          cvSelections: true,
        },
      },
    },
  })

  const experiences: AdminExperienceListItem[] = rawExperiences.map((e) => ({
    id: e.id,
    organization: e.organization,
    position: e.position,
    category: e.category,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent,
    description: e.description,
    responsibilities: e.responsibilities,
    achievements: e.achievements,
    published: e.published,
    sortOrder: e.sortOrder,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    skills: e.skills,
    cvSelectionsCount: e._count.cvSelections,
  }))

  return {
    experiences,
    totalCount,
    publishedCount,
    privateCount,
    categoryCounts,
    profileId: profile.id,
  }
}

/**
 * Mengambil satu pengalaman untuk /dashboard/experience/[id]/edit
 */
export async function getAdminExperienceById(id: string) {
  const admin = await requireAdmin()

  const experience = await db.experience.findFirst({
    where: {
      id,
      profile: {
        administratorId: admin.id,
      },
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      _count: {
        select: {
          cvSelections: true,
        },
      },
    },
  })

  return experience
}

export interface AdminEducationListItem {
  id: string
  institution: string
  degree: string | null
  fieldOfStudy: string | null
  startDate: Date | null
  endDate: Date | null
  isCurrent: boolean
  gpa: string | null
  description: string | null
  published: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  cvSelectionsCount: number
}

export interface AdminEducationsResult {
  educations: AdminEducationListItem[]
  totalCount: number
  publishedCount: number
  privateCount: number
  profileId: string | null
}

/**
 * Mengambil daftar riwayat pendidikan untuk /dashboard/education
 */
export async function getAdminEducations(options: { search?: string } = {}): Promise<AdminEducationsResult> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      educations: [],
      totalCount: 0,
      publishedCount: 0,
      privateCount: 0,
      profileId: null,
    }
  }

  const [totalCount, publishedCount, privateCount] = await Promise.all([
    db.education.count({ where: { profileId: profile.id } }),
    db.education.count({ where: { profileId: profile.id, published: true } }),
    db.education.count({ where: { profileId: profile.id, published: false } }),
  ])

  const whereClause: Record<string, unknown> = {
    profileId: profile.id,
  }

  if (options.search && options.search.trim()) {
    const term = options.search.trim()
    whereClause.OR = [
      { institution: { contains: term, mode: 'insensitive' } },
      { degree: { contains: term, mode: 'insensitive' } },
      { fieldOfStudy: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ]
  }

  const rawEducations = await db.education.findMany({
    where: whereClause,
    orderBy: [
      { sortOrder: 'asc' },
      { startDate: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      _count: {
        select: { cvSelections: true },
      },
    },
  })

  const educations: AdminEducationListItem[] = rawEducations.map((e) => ({
    id: e.id,
    institution: e.institution,
    degree: e.degree,
    fieldOfStudy: e.fieldOfStudy,
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent,
    gpa: e.gpa,
    description: e.description,
    published: e.published,
    sortOrder: e.sortOrder,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    cvSelectionsCount: e._count.cvSelections,
  }))

  return {
    educations,
    totalCount,
    publishedCount,
    privateCount,
    profileId: profile.id,
  }
}

export interface AdminCertificationListItem {
  id: string
  title: string
  issuer: string | null
  issueDate: Date | null
  expirationDate: Date | null
  credentialId: string | null
  credentialUrl: string | null
  description: string | null
  published: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  cvSelectionsCount: number
}

export interface AdminCertificationsResult {
  certifications: AdminCertificationListItem[]
  totalCount: number
  publishedCount: number
  privateCount: number
  profileId: string | null
}

/**
 * Mengambil daftar sertifikasi & pencapaian untuk /dashboard/certifications
 */
export async function getAdminCertifications(options: { search?: string } = {}): Promise<AdminCertificationsResult> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      certifications: [],
      totalCount: 0,
      publishedCount: 0,
      privateCount: 0,
      profileId: null,
    }
  }

  const [totalCount, publishedCount, privateCount] = await Promise.all([
    db.certification.count({ where: { profileId: profile.id } }),
    db.certification.count({ where: { profileId: profile.id, published: true } }),
    db.certification.count({ where: { profileId: profile.id, published: false } }),
  ])

  const whereClause: Record<string, unknown> = {
    profileId: profile.id,
  }

  if (options.search && options.search.trim()) {
    const term = options.search.trim()
    whereClause.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { issuer: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { credentialId: { contains: term, mode: 'insensitive' } },
    ]
  }

  const rawCertifications = await db.certification.findMany({
    where: whereClause,
    orderBy: [
      { sortOrder: 'asc' },
      { issueDate: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      _count: {
        select: { cvSelections: true },
      },
    },
  })

  const certifications: AdminCertificationListItem[] = rawCertifications.map((c) => ({
    id: c.id,
    title: c.title,
    issuer: c.issuer,
    issueDate: c.issueDate,
    expirationDate: c.expirationDate,
    credentialId: c.credentialId,
    credentialUrl: c.credentialUrl,
    description: c.description,
    published: c.published,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    cvSelectionsCount: c._count.cvSelections,
  }))

  return {
    certifications,
    totalCount,
    publishedCount,
    privateCount,
    profileId: profile.id,
  }
}

export interface AdminPortfolioRecordItem {
  id: string
  title: string
  subtitle?: string | null
  type: RecordType
  published: boolean
  featured?: boolean
  sortOrder: number
  updatedAt: Date
  href: string
}

export interface AdminPortfolioManagerData {
  profile: {
    id: string
    fullName: string
    headline: string
    summary: string | null
    photoUrl: string | null
    email: string | null
  } | null
  settings: {
    id: string
    slug: string
    isPublished: boolean
    showEmail: boolean
    showPhone: boolean
    showLocation: boolean
    showLinkedin: boolean
    showGithub: boolean
    defaultCvId: string | null
  } | null
  isProfileComplete: boolean
  records: {
    projects: AdminPortfolioRecordItem[]
    experiences: AdminPortfolioRecordItem[]
    educations: AdminPortfolioRecordItem[]
    skills: AdminPortfolioRecordItem[]
    certifications: AdminPortfolioRecordItem[]
  }
  summary: {
    totalRecords: number
    publishedRecords: number
    featuredProjects: number
  }
}

/**
 * Mengambil data manajer portofolio untuk /dashboard/portfolio
 * Termasuk data profil, status publikasi portofolio, slug, dan daftar semua record per tipe.
 */
export async function getAdminPortfolioManagerData(): Promise<AdminPortfolioManagerData> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    include: {
      settings: true,
      projects: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          projectType: true,
          published: true,
          featured: true,
          sortOrder: true,
          updatedAt: true,
        },
      },
      experiences: {
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
        select: {
          id: true,
          position: true,
          organization: true,
          category: true,
          published: true,
          sortOrder: true,
          updatedAt: true,
        },
      },
      educations: {
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
        select: {
          id: true,
          institution: true,
          degree: true,
          fieldOfStudy: true,
          published: true,
          sortOrder: true,
          updatedAt: true,
        },
      },
      skills: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          name: true,
          category: true,
          published: true,
          sortOrder: true,
          updatedAt: true,
        },
      },
      certifications: {
        orderBy: [{ sortOrder: 'asc' }, { issueDate: 'desc' }],
        select: {
          id: true,
          title: true,
          issuer: true,
          published: true,
          sortOrder: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!profile) {
    return {
      profile: null,
      settings: null,
      isProfileComplete: false,
      records: {
        projects: [],
        experiences: [],
        educations: [],
        skills: [],
        certifications: [],
      },
      summary: {
        totalRecords: 0,
        publishedRecords: 0,
        featuredProjects: 0,
      },
    }
  }

  const isComplete = Boolean(
    profile.fullName &&
      profile.fullName.trim().length > 0 &&
      profile.headline &&
      profile.headline.trim().length > 0
  )

  const projects: AdminPortfolioRecordItem[] = profile.projects.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.projectType || undefined,
    type: 'PROJECT',
    published: p.published,
    featured: p.featured,
    sortOrder: p.sortOrder,
    updatedAt: p.updatedAt,
    href: '/dashboard/projects',
  }))

  const experiences: AdminPortfolioRecordItem[] = profile.experiences.map((e) => ({
    id: e.id,
    title: e.position,
    subtitle: e.organization,
    type: 'EXPERIENCE',
    published: e.published,
    sortOrder: e.sortOrder,
    updatedAt: e.updatedAt,
    href: '/dashboard/experience',
  }))

  const educations: AdminPortfolioRecordItem[] = profile.educations.map((ed) => ({
    id: ed.id,
    title: ed.institution,
    subtitle: [ed.degree, ed.fieldOfStudy].filter(Boolean).join(' • ') || undefined,
    type: 'EDUCATION',
    published: ed.published,
    sortOrder: ed.sortOrder,
    updatedAt: ed.updatedAt,
    href: '/dashboard/education',
  }))

  const skills: AdminPortfolioRecordItem[] = profile.skills.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: s.category,
    type: 'SKILLS' as unknown as RecordType,
    published: s.published,
    sortOrder: s.sortOrder,
    updatedAt: s.updatedAt,
    href: '/dashboard/skills',
  }))

  const certifications: AdminPortfolioRecordItem[] = profile.certifications.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.issuer || undefined,
    type: 'CERTIFICATION',
    published: c.published,
    sortOrder: c.sortOrder,
    updatedAt: c.updatedAt,
    href: '/dashboard/certifications',
  }))

  const allRecords = [...projects, ...experiences, ...educations, ...skills, ...certifications]
  const publishedRecords = allRecords.filter((r) => r.published).length
  const featuredProjects = projects.filter((p) => p.featured).length

  return {
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      headline: profile.headline,
      summary: profile.summary,
      photoUrl: profile.photoUrl,
      email: profile.email,
    },
    settings: profile.settings
      ? {
          id: profile.settings.id,
          slug: profile.settings.slug,
          isPublished: profile.settings.isPublished,
          showEmail: profile.settings.showEmail,
          showPhone: profile.settings.showPhone,
          showLocation: profile.settings.showLocation,
          showLinkedin: profile.settings.showLinkedin,
          showGithub: profile.settings.showGithub,
          defaultCvId: profile.settings.defaultCvId,
        }
      : null,
    isProfileComplete: isComplete,
    records: {
      projects,
      experiences,
      educations,
      skills,
      certifications,
    },
    summary: {
      totalRecords: allRecords.length,
      publishedRecords,
      featuredProjects,
    },
  }
}

