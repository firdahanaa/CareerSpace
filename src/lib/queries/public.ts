import { db } from '@/lib/db'
import {
  filterVisibleContacts,
  type ContactVisibilitySettings,
  type OtherLinkItem,
} from '@/lib/validation/profile'

export interface PublicPortfolioData {
  profile: {
    id: string
    fullName: string
    headline: string
    summary: string | null
    photoUrl: string | null
    location: string | null
    email: string | null
    phone: string | null
    linkedinUrl: string | null
    githubUrl: string | null
    otherLinks: OtherLinkItem[]
  }
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
  }
  visibleContacts: {
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    otherLinks: OtherLinkItem[]
  }
  projects: Array<{
    id: string
    slug: string
    title: string
    shortSummary: string
    description: string | null
    projectType: string | null
    startDate: Date | null
    endDate: Date | null
    isOngoing: boolean
    technologies: string[]
    coverImageUrl: string | null
    repositoryUrl: string | null
    demoUrl: string | null
    featured: boolean
    sortOrder: number
    skills: Array<{
      skill: {
        id: string
        name: string
        category: string
      }
    }>
  }>
  featuredProjects: Array<{
    id: string
    slug: string
    title: string
    shortSummary: string
    description: string | null
    projectType: string | null
    startDate: Date | null
    endDate: Date | null
    isOngoing: boolean
    technologies: string[]
    coverImageUrl: string | null
    repositoryUrl: string | null
    demoUrl: string | null
    featured: boolean
    sortOrder: number
  }>
  experiences: Array<{
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
    sortOrder: number
    skills: Array<{
      skill: {
        id: string
        name: string
        category: string
      }
    }>
  }>
  educations: Array<{
    id: string
    institution: string
    degree: string | null
    fieldOfStudy: string | null
    startDate: Date | null
    endDate: Date | null
    isCurrent: boolean
    gpa: string | null
    description: string | null
    sortOrder: number
  }>
  skills: Array<{
    id: string
    name: string
    category: string
    proficiency: string | null
    sortOrder: number
  }>
  certifications: Array<{
    id: string
    title: string
    issuer: string | null
    issueDate: Date | null
    expirationDate: Date | null
    credentialId: string | null
    credentialUrl: string | null
    description: string | null
    sortOrder: number
  }>
}

export interface GetPublicPortfolioOptions {
  /**
   * Jika true, mengabaikan pemeriksaan settings.isPublished (hanya untuk preview admin terautentikasi).
   * Record karier tetap WAJIB published = true sesuai PRD.
   */
  preview?: boolean
}

/**
 * Mengambil data portofolio publik berdasarkan slug.
 * WAJIB: Hanya mengambil record dengan status `published = true` (AGENTS.md Bagian 4 Aturan 1).
 */
export async function getPublicPortfolioBySlug(
  slug: string,
  options: GetPublicPortfolioOptions = {}
): Promise<PublicPortfolioData | null> {
  const normalizedSlug = slug.trim().toLowerCase()

  const settings = await db.portfolioSettings.findUnique({
    where: { slug: normalizedSlug },
    include: {
      profile: true,
    },
  })

  if (!settings || !settings.profile) {
    return null
  }

  // Jika portofolio belum dipublikasikan dan bukan dalam mode pratinjau admin, tolak akses publik
  if (!settings.isPublished && !options.preview) {
    return null
  }

  const profile = settings.profile

  const visibilitySettings: ContactVisibilitySettings = {
    showEmail: settings.showEmail,
    showPhone: settings.showPhone,
    showLocation: settings.showLocation,
    showLinkedin: settings.showLinkedin,
    showGithub: settings.showGithub,
  }

  const visibleContacts = filterVisibleContacts(profile, visibilitySettings)

  // Ambil SEMUA data karier dengan filter KETAT `published = true`
  const [projectsRaw, experiencesRaw, educationsRaw, skillsRaw, certificationsRaw] =
    await Promise.all([
      db.project.findMany({
        where: {
          profileId: profile.id,
          published: true, // WAJIB filter published
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          skills: {
            include: {
              skill: {
                select: { id: true, name: true, category: true },
              },
            },
          },
        },
      }),
      db.experience.findMany({
        where: {
          profileId: profile.id,
          published: true, // WAJIB filter published
        },
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
        include: {
          skills: {
            include: {
              skill: {
                select: { id: true, name: true, category: true },
              },
            },
          },
        },
      }),
      db.education.findMany({
        where: {
          profileId: profile.id,
          published: true, // WAJIB filter published
        },
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
      }),
      db.skill.findMany({
        where: {
          profileId: profile.id,
          published: true, // WAJIB filter published
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      db.certification.findMany({
        where: {
          profileId: profile.id,
          published: true, // WAJIB filter published
        },
        orderBy: [{ sortOrder: 'asc' }, { issueDate: 'desc' }],
      }),
    ])

  const projects = projectsRaw.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortSummary: p.shortSummary,
    description: p.description,
    projectType: p.projectType,
    startDate: p.startDate,
    endDate: p.endDate,
    isOngoing: p.isOngoing,
    technologies: p.technologies,
    coverImageUrl: p.coverImageUrl,
    repositoryUrl: p.repositoryUrl,
    demoUrl: p.demoUrl,
    featured: p.featured,
    sortOrder: p.sortOrder,
    skills: p.skills,
  }))

  const featuredProjects = projects.filter((p) => p.featured)

  return {
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      headline: profile.headline,
      summary: profile.summary,
      photoUrl: profile.photoUrl,
      location: profile.location,
      email: profile.email,
      phone: profile.phone,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      otherLinks: visibleContacts.otherLinks,
    },
    settings: {
      id: settings.id,
      slug: settings.slug,
      isPublished: settings.isPublished,
      showEmail: settings.showEmail,
      showPhone: settings.showPhone,
      showLocation: settings.showLocation,
      showLinkedin: settings.showLinkedin,
      showGithub: settings.showGithub,
      defaultCvId: settings.defaultCvId,
    },
    visibleContacts,
    projects,
    featuredProjects,
    experiences: experiencesRaw.map((e) => ({
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
      sortOrder: e.sortOrder,
      skills: e.skills,
    })),
    educations: educationsRaw.map((ed) => ({
      id: ed.id,
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
      startDate: ed.startDate,
      endDate: ed.endDate,
      isCurrent: ed.isCurrent,
      gpa: ed.gpa,
      description: ed.description,
      sortOrder: ed.sortOrder,
    })),
    skills: skillsRaw.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      sortOrder: s.sortOrder,
    })),
    certifications: certificationsRaw.map((c) => ({
      id: c.id,
      title: c.title,
      issuer: c.issuer,
      issueDate: c.issueDate,
      expirationDate: c.expirationDate,
      credentialId: c.credentialId,
      credentialUrl: c.credentialUrl,
      description: c.description,
      sortOrder: c.sortOrder,
    })),
  }
}
