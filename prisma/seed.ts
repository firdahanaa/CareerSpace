import { PrismaClient, SkillCategory, ProficiencyLevel, ProjectType, ExperienceCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data in reverse order of dependencies
  await prisma.cvRecordSelection.deleteMany()
  await prisma.cvSection.deleteMany()
  await prisma.cvExport.deleteMany()
  await prisma.cvConfig.deleteMany()
  await prisma.projectSkill.deleteMany()
  await prisma.experienceSkill.deleteMany()
  await prisma.project.deleteMany()
  await prisma.experience.deleteMany()
  await prisma.education.deleteMany()
  await prisma.certification.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.portfolioSettings.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.administrator.deleteMany()

  // 1. Administrator
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mycareerspace.local'
  const rawPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || (await bcrypt.hash(rawPassword, 10))

  const admin = await prisma.administrator.create({
    data: {
      email: adminEmail,
      passwordHash,
    },
  })
  console.log(`✅ Admin created: ${admin.email}`)

  // 2. Profile
  const profile = await prisma.profile.create({
    data: {
      administratorId: admin.id,
      fullName: 'Firda Hana',
      headline: 'Full-Stack Engineer & Technical Architect',
      summary:
        'Software engineer with over 5 years of experience in building modern web applications, scalable data services, and clean developer tooling.',
      email: 'firda@example.com',
      phone: '+62 812-3456-7890',
      location: 'Jakarta, Indonesia',
      linkedinUrl: 'https://linkedin.com/in/firdahana',
      githubUrl: 'https://github.com/firdahana',
      otherLinks: [
        { label: 'Blog', url: 'https://firdahana.dev/blog' },
      ],
    },
  })
  console.log(`✅ Profile created: ${profile.fullName}`)

  // 3. Portfolio Settings (Default not published yet)
  const settings = await prisma.portfolioSettings.create({
    data: {
      profileId: profile.id,
      slug: 'firdahana',
      isPublished: false,
      showEmail: true,
      showPhone: false,
      showLocation: true,
      showLinkedin: true,
      showGithub: true,
    },
  })
  console.log(`✅ PortfolioSettings created: slug=${settings.slug}, isPublished=${settings.isPublished}`)

  // 4. Skills (5 skills: 3 published, 2 unpublished)
  const skillTs = await prisma.skill.create({
    data: {
      profileId: profile.id,
      name: 'TypeScript',
      category: SkillCategory.TECHNICAL,
      proficiency: ProficiencyLevel.EXPERT,
      published: true,
      sortOrder: 1,
    },
  })

  const skillNext = await prisma.skill.create({
    data: {
      profileId: profile.id,
      name: 'Next.js',
      category: SkillCategory.TECHNICAL,
      proficiency: ProficiencyLevel.ADVANCED,
      published: true,
      sortOrder: 2,
    },
  })

  const skillPg = await prisma.skill.create({
    data: {
      profileId: profile.id,
      name: 'PostgreSQL',
      category: SkillCategory.TECHNICAL,
      proficiency: ProficiencyLevel.ADVANCED,
      published: true,
      sortOrder: 3,
    },
  })

  await prisma.skill.create({
    data: {
      profileId: profile.id,
      name: 'Data Analysis',
      category: SkillCategory.ANALYTICAL,
      proficiency: ProficiencyLevel.INTERMEDIATE,
      published: false,
      sortOrder: 4,
    },
  })

  await prisma.skill.create({
    data: {
      profileId: profile.id,
      name: 'UI/UX Prototyping',
      category: SkillCategory.TECHNICAL,
      proficiency: ProficiencyLevel.INTERMEDIATE,
      published: false,
      sortOrder: 5,
    },
  })
  console.log('✅ 5 Skills created (3 published, 2 private)')

  // 5. Projects (3 projects: 2 published, 1 private)
  await prisma.project.create({
    data: {
      profileId: profile.id,
      slug: 'real-time-analytics-platform',
      title: 'Real-Time Analytics Platform',
      shortSummary: 'High-throughput metrics aggregator and interactive operational dashboard.',
      description:
        'Architected an end-to-end telemetry system processing streaming event pipelines, featuring sub-second query latency and custom dashboard visualization.',
      projectType: ProjectType.PROFESSIONAL,
      startDate: new Date('2023-03-01'),
      endDate: new Date('2023-11-30'),
      isOngoing: false,
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
      responsibilities: [
        'Designed database indexing and time-series rollups',
        'Implemented responsive charting views using React and Tailwind',
      ],
      outcomes: [
        'Supported 50,000 queries per minute with 99.9% uptime',
        'Decreased report generation time by 65%',
      ],
      repositoryUrl: 'https://github.com/firdahana/analytics-engine',
      demoUrl: 'https://analytics-demo.firdahana.dev',
      featured: true,
      published: true,
      sortOrder: 1,
      skills: {
        create: [
          { skillId: skillTs.id },
          { skillId: skillNext.id },
          { skillId: skillPg.id },
        ],
      },
    },
  })

  await prisma.project.create({
    data: {
      profileId: profile.id,
      slug: 'automated-course-scheduler',
      title: 'Automated Course Scheduler',
      shortSummary: 'Constraint-satisfaction scheduling application for academic departments.',
      description:
        'Developed an algorithm-driven timetable coordinator preventing room and professor conflicts for university departments.',
      projectType: ProjectType.ACADEMIC,
      startDate: new Date('2022-09-01'),
      endDate: new Date('2023-01-15'),
      isOngoing: false,
      technologies: ['TypeScript', 'Algorithms'],
      responsibilities: [
        'Formulated scheduling constraints into combinatorial backtracking solver',
        'Built interactive timetable grid with conflict notifications',
      ],
      outcomes: [
        'Reduced scheduling department workload from 3 days to under 5 minutes',
      ],
      featured: false,
      published: true,
      sortOrder: 2,
      skills: {
        create: [
          { skillId: skillTs.id },
        ],
      },
    },
  })

  await prisma.project.create({
    data: {
      profileId: profile.id,
      slug: 'internal-service-mesh-gui',
      title: 'Internal Service Mesh Management GUI',
      shortSummary: 'Internal administration console for infrastructure monitoring (Draft).',
      description:
        'Private developer tooling prototype designed to visualize microservice topologies and traffic routes.',
      projectType: ProjectType.PERSONAL,
      startDate: new Date('2024-01-10'),
      isOngoing: true,
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL'],
      responsibilities: [
        'Built secure authenticated routing layer',
      ],
      outcomes: [
        'Internal prototype under active design review',
      ],
      featured: false,
      published: false, // Private
      sortOrder: 3,
      skills: {
        create: [
          { skillId: skillNext.id },
          { skillId: skillPg.id },
        ],
      },
    },
  })
  console.log('✅ 3 Projects created (2 published, 1 private)')

  // 6. Experience (2 experiences: 1 published, 1 private)
  await prisma.experience.create({
    data: {
      profileId: profile.id,
      organization: 'PT Digital Inovasi Nusantara',
      position: 'Senior Software Engineer',
      category: ExperienceCategory.EMPLOYMENT,
      location: 'Jakarta, Indonesia',
      startDate: new Date('2023-01-01'),
      isCurrent: true,
      description:
        'Leading the core platforms engineering team building high-performance customer-facing web applications.',
      responsibilities: [
        'Spearhead frontend architectural migration to Next.js App Router',
        'Mentor junior engineers in TypeScript best practices and code reviews',
      ],
      achievements: [
        'Cut bundle size by 42% through optimized modular imports',
        'Achieved 99.95% API reliability over 12 consecutive months',
      ],
      published: true,
      sortOrder: 1,
      skills: {
        create: [
          { skillId: skillTs.id },
          { skillId: skillNext.id },
          { skillId: skillPg.id },
        ],
      },
    },
  })

  await prisma.experience.create({
    data: {
      profileId: profile.id,
      organization: 'Open Source Community Bandung',
      position: 'Technical Lead & Core Contributor',
      category: ExperienceCategory.ORGANIZATION,
      location: 'Bandung, Indonesia',
      startDate: new Date('2021-06-01'),
      endDate: new Date('2022-12-31'),
      isCurrent: false,
      description:
        'Organized regional developer meetups and coordinated open-source software sprints.',
      responsibilities: [
        'Curated technical workshop curriculum on modern web development',
      ],
      achievements: [
        'Conducted 12 community workshops with 800+ total attendees',
      ],
      published: false, // Private
      sortOrder: 2,
      skills: {
        create: [
          { skillId: skillTs.id },
        ],
      },
    },
  })
  console.log('✅ 2 Experiences created (1 published, 1 private)')

  // 7. Education (1 education: published)
  await prisma.education.create({
    data: {
      profileId: profile.id,
      institution: 'Universitas Indonesia',
      degree: 'Bachelor of Science in Computer Science',
      fieldOfStudy: 'Computer Science',
      startDate: new Date('2018-09-01'),
      endDate: new Date('2022-07-01'),
      isCurrent: false,
      gpa: '3.86/4.00',
      description: 'Graduated Cum Laude. Focused on software engineering, distributed systems, and databases.',
      published: true,
      sortOrder: 1,
    },
  })
  console.log('✅ 1 Education created (published)')

  // 8. Certification (1 certification: published)
  await prisma.certification.create({
    data: {
      profileId: profile.id,
      title: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      issueDate: new Date('2023-05-20'),
      expirationDate: new Date('2026-05-20'),
      credentialId: 'AWS-PSA-9948210',
      credentialUrl: 'https://aws.amazon.com/verification',
      description: 'Validation of cloud architecture knowledge covering resilient, high-performing compute and storage designs.',
      published: true,
      sortOrder: 1,
    },
  })
  console.log('✅ 1 Certification created (published)')

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
