/**
 * Seed simplificado con integracion opcional a Google Drive (via n8n)
 * Estructura: UTN -> FRM -> 2 carreras -> 3 materias c/u -> 4 comisiones c/u
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../src/config/database.js';
import University from '../src/models/University.js';
import Faculty from '../src/models/Faculty.js';
import Career from '../src/models/Career.js';
import Course from '../src/models/Course.js';
import Commission from '../src/models/Commission.js';
import Rubric, { RUBRIC_TYPES } from '../src/models/Rubric.js';
import User from '../src/models/User.js';
import * as driveService from '../src/services/driveService.js';

dotenv.config();

const seedDriveEnabled = process.env.SEED_CREATE_DRIVE_FOLDERS === 'true';
const driveStats = {
  universities: { success: 0, failed: 0 },
  faculties: { success: 0, failed: 0 },
  careers: { success: 0, failed: 0 },
  courses: { success: 0, failed: 0 },
  commissions: { success: 0, failed: 0 },
};

// Dataset reducido
const universities = [{ university_id: 'utn', name: 'Universidad Tecnologica Nacional (UTN)' }];
const faculties = [{ faculty_id: 'frm', name: 'Facultad Regional Mendoza', university_id: 'utn' }];
const careers = [
  { career_id: 'isi-frm', name: 'Ingenieria en Sistemas de Informacion', faculty_id: 'frm', university_id: 'utn' },
  { career_id: 'tup-frm', name: 'Tecnicatura Universitaria en Programacion', faculty_id: 'frm', university_id: 'utn' },
];
const currentYear = 2025;
const courses = [
  { course_id: `${currentYear}-isi-frm-programacion-1`, name: 'Programacion 1', year: currentYear, career_id: 'isi-frm', faculty_id: 'frm', university_id: 'utn' },
  { course_id: `${currentYear}-isi-frm-programacion-2`, name: 'Programacion 2', year: currentYear, career_id: 'isi-frm', faculty_id: 'frm', university_id: 'utn' },
  { course_id: `${currentYear}-isi-frm-programacion-3`, name: 'Programacion 3', year: currentYear, career_id: 'isi-frm', faculty_id: 'frm', university_id: 'utn' },
  { course_id: `${currentYear}-tup-frm-programacion-1`, name: 'Programacion 1', year: currentYear, career_id: 'tup-frm', faculty_id: 'frm', university_id: 'utn' },
  { course_id: `${currentYear}-tup-frm-programacion-2`, name: 'Programacion 2', year: currentYear, career_id: 'tup-frm', faculty_id: 'frm', university_id: 'utn' },
  { course_id: `${currentYear}-tup-frm-programacion-3`, name: 'Programacion 3', year: currentYear, career_id: 'tup-frm', faculty_id: 'frm', university_id: 'utn' },
];

// Rubrica 1: TP Listas (Programacion 1)
const rubric1JSON = {
  rubric_id: 'practico-5-listas',
  title: 'Practico 5: Listas',
  version: '1.0',
  assessment_type: 'tp',
  course: 'Programacion 1',
  language_or_stack: ['python'],
  submission: {
    single_file: true,
    accepted_extensions: ['.py'],
    delivery_channel: 'plataforma',
    constraints: ['El codigo fuente debe ser entregado en un unico archivo Python (.py).'],
  },
  grading: {
    policy: 'weighted_average',
    rounding: 'half_up',
    total_points: 100,
  },
  criteria: [
    {
      id: 'C1',
      name: 'Correctitud y Funcionalidad',
      weight: 0.35,
      description: 'El codigo funciona segun las consignas y los calculos son correctos.',
      subcriteria: [],
    },
    {
      id: 'C2',
      name: 'Manipulacion de Listas',
      weight: 0.25,
      description: 'Uso correcto de listas, slicing, metodos integrados y listas anidadas.',
      subcriteria: [],
    },
    {
      id: 'C3',
      name: 'Control de Flujo',
      weight: 0.15,
      description: 'Bucles y condicionales aplicados correctamente.',
      subcriteria: [],
    },
    {
      id: 'C4',
      name: 'Legibilidad y Buenas Practicas',
      weight: 0.15,
      description: 'Nombres claros, comentarios necesarios y estilo consistente.',
      subcriteria: [],
    },
    {
      id: 'C5',
      name: 'Resolucion de Problemas',
      weight: 0.1,
      description: 'Capacidad para resolver consignas especificas.',
      subcriteria: [],
    },
  ],
  penalties: [
    { description: 'Plagio detectado', penalty_percent: 100 },
    { description: 'Formato de entrega incorrecto', penalty_percent: 10 },
  ],
  mandatory_fail_conditions: [],
  tasks: [],
};

// Rubrica 2: Parcial Programacion 2
const rubric2JSON = {
  rubric_id: 'evaluacion-parcial-prog2',
  title: 'Rubrica de Evaluacion - Programacion 2',
  version: '1.0.0',
  assessment_type: 'parcial',
  course: 'Programacion 2',
  language_or_stack: ['python'],
  submission: {
    single_file: false,
    accepted_extensions: ['.py', '.md'],
    delivery_channel: 'repositorio',
    constraints: [
      'Proyecto organizado por modulos (services/, utils/, tests/).',
      'Debe incluir README con instrucciones de ejecucion.',
      'Sistema debe ejecutarse con "python main.py" o script equivalente.',
    ],
  },
  grading: {
    policy: 'sum',
    rounding: 'half_up',
    total_points: 260,
  },
  criteria: [
    {
      id: 'C1',
      name: 'Patrones y Diseno',
      weight: 0.3077,
      description: 'Implementacion de patrones y arquitectura modular.',
      subcriteria: [
        {
          name: 'Patron Factory/Strategy',
          weight: 0.25,
          evidence: ['Separacion de responsabilidades', 'Uso de factories', 'Estrategias intercambiables'],
        },
        {
          name: 'Inyeccion de dependencias',
          weight: 0.25,
          evidence: ['Servicios reciben dependencias por constructor', 'Evitacion de acoplamiento fuerte'],
        },
        {
          name: 'Capa de servicios y dominio',
          weight: 0.25,
          evidence: ['Servicios sin logica de presentacion'],
        },
        {
          name: 'Separacion de vistas/CLI',
          weight: 0.25,
          evidence: ['Entrada/salida aislada de la logica'],
        },
      ],
    },
    {
      id: 'C2',
      name: 'Arquitectura y Diseno',
      weight: 0.2308,
      description: 'Separacion de responsabilidades y manejo de excepciones.',
      subcriteria: [],
    },
    {
      id: 'C3',
      name: 'Calidad de Codigo',
      weight: 0.2308,
      description: 'PEP8, docstrings, type hints y nombres significativos.',
      subcriteria: [],
    },
    {
      id: 'C4',
      name: 'Funcionalidad del Sistema',
      weight: 0.1538,
      description: 'Flujo principal y casos de uso implementados.',
      subcriteria: [],
    },
    {
      id: 'C5',
      name: 'Buenas Practicas Avanzadas',
      weight: 0.0769,
      description: 'Validaciones, logging y manejo de errores.',
      subcriteria: [],
    },
  ],
  penalties: [
    { description: 'Magic numbers sin constantes', penalty_percent: 5 },
    { description: 'Uso de lambdas complejas', penalty_percent: 5 },
    { description: 'Falta de docstrings en funciones clave', penalty_percent: 10 },
  ],
  mandatory_fail_conditions: ['Plagio detectado', 'Proyecto no ejecutable'],
  tasks: [],
};

const trackDriveResult = (key, idLabel, result, reason) => {
  const succeeded = result && result.success !== false;
  if (succeeded) {
    driveStats[key].success += 1;
  } else {
    driveStats[key].failed += 1;
    const detail = reason?.message || result?.message || 'Error desconocido';
    console.warn(`WARN  Fallo carpeta ${key.slice(0, -1)} ${idLabel}: ${detail}`);
  }
};

const seedDatabase = async () => {
  try {
    console.log('>>> Iniciando migracion de datos con Drive opcional...\n');

    await connectDB();

    console.log('>>> Borrando base de datos completa (colecciones + indices)...');
    await mongoose.connection.dropDatabase();
    console.log('OK  Base eliminada completamente\n');

    console.log('>>> Migrando universidades...');
    const createdUniversities = await University.insertMany(universities);
    console.log(`OK  ${createdUniversities.length} universidades creadas\n`);
    if (seedDriveEnabled) {
      const uniResults = await Promise.allSettled(
        createdUniversities.map(u => driveService.createUniversityFolder(u.university_id))
      );
      uniResults.forEach((res, idx) =>
        trackDriveResult('universities', createdUniversities[idx].university_id, res.status === 'fulfilled' ? res.value : null, res.reason)
      );
    }

    console.log('>>> Migrando facultades...');
    const createdFaculties = await Faculty.insertMany(faculties);
    console.log(`OK  ${createdFaculties.length} facultades creadas\n`);
    if (seedDriveEnabled) {
      const facResults = await Promise.allSettled(
        createdFaculties.map(f => driveService.createFacultyFolder(f.faculty_id, f.university_id))
      );
      facResults.forEach((res, idx) =>
        trackDriveResult('faculties', createdFaculties[idx].faculty_id, res.status === 'fulfilled' ? res.value : null, res.reason)
      );
    }

    console.log('>>> Migrando carreras...');
    const createdCareers = await Career.insertMany(careers);
    console.log(`OK  ${createdCareers.length} carreras creadas\n`);
    if (seedDriveEnabled) {
      const careerResults = await Promise.allSettled(
        createdCareers.map(c => driveService.createCareerFolder(c.career_id, c.faculty_id, c.university_id))
      );
      careerResults.forEach((res, idx) =>
        trackDriveResult('careers', createdCareers[idx].career_id, res.status === 'fulfilled' ? res.value : null, res.reason)
      );
    }

    console.log('>>> Migrando cursos...');
    const createdCourses = await Course.insertMany(courses);
    console.log(`OK  ${createdCourses.length} cursos creados\n`);
    if (seedDriveEnabled) {
      const courseResults = await Promise.allSettled(
        createdCourses.map(c =>
          driveService.createCourseFolder(c.course_id, c.career_id, c.faculty_id, c.university_id)
        )
      );
      courseResults.forEach((res, idx) =>
        trackDriveResult('courses', createdCourses[idx].course_id, res.status === 'fulfilled' ? res.value : null, res.reason)
      );
    }

    console.log('>>> Creando usuarios de prueba...\n');
    const users = [];

    const superAdmin = new User({
      username: 'superadmin',
      name: 'Super Administrador',
      password: 'admin123',
      role: 'super-admin',
      university_id: null,
      deleted: false,
    });
    await superAdmin.save();
    users.push(superAdmin);
    console.log('   OK super-admin: superadmin / admin123 (acceso global)');

    const universityAdmin = new User({
      username: 'admin-utn',
      name: 'Administrador UTN',
      password: 'admin123',
      role: 'university-admin',
      university_id: 'utn',
      deleted: false,
    });
    await universityAdmin.save();
    users.push(universityAdmin);
    console.log('   OK university-admin: admin-utn / admin123 (gestiona UTN)');

    const facultyAdminFRM = new User({
      username: 'admin-frm',
      name: 'Administrador FRM',
      password: 'admin123',
      role: 'faculty-admin',
      university_id: 'utn',
      faculty_id: 'frm',
      first_login: true,
      deleted: false,
    });
    await facultyAdminFRM.save();
    users.push(facultyAdminFRM);
    console.log('   OK faculty-admin: admin-frm / admin123 (gestiona FRM)');

    const professorAdminProg1ISI = new User({
      username: 'jefe-prog1-frm',
      name: 'Jefe Programacion 1 FRM',
      password: 'admin123',
      role: 'professor-admin',
      university_id: 'utn',
      faculty_id: 'frm',
      course_ids: [`${currentYear}-isi-frm-programacion-1`],
      first_login: true,
      deleted: false,
    });
    await professorAdminProg1ISI.save();
    users.push(professorAdminProg1ISI);
    console.log('   OK professor-admin: jefe-prog1-frm / admin123 (Programacion 1 ISI)');

    const professorAdminProg2ISI = new User({
      username: 'jefe-prog2-frm',
      name: 'Jefe Programacion 2 FRM',
      password: 'admin123',
      role: 'professor-admin',
      university_id: 'utn',
      faculty_id: 'frm',
      course_ids: [`${currentYear}-isi-frm-programacion-2`],
      first_login: true,
      deleted: false,
    });
    await professorAdminProg2ISI.save();
    users.push(professorAdminProg2ISI);
    console.log('   OK professor-admin: jefe-prog2-frm / admin123 (Programacion 2 ISI)');

    const professorAdminProg1TUP = new User({
      username: 'jefe-prog1-tup',
      name: 'Jefe Programacion 1 TUP FRM',
      password: 'admin123',
      role: 'professor-admin',
      university_id: 'utn',
      faculty_id: 'frm',
      course_ids: [`${currentYear}-tup-frm-programacion-1`],
      first_login: true,
      deleted: false,
    });
    await professorAdminProg1TUP.save();
    users.push(professorAdminProg1TUP);
    console.log('   OK professor-admin: jefe-prog1-tup / admin123 (Programacion 1 TUP)');

    const professor1 = new User({
      username: 'prof-garcia',
      name: 'Maria Garcia',
      password: 'prof123',
      role: 'professor',
      university_id: 'utn',
      deleted: false,
    });
    await professor1.save();
    users.push(professor1);
    console.log('   OK professor: prof-garcia / prof123');

    const professor2 = new User({
      username: 'prof-lopez',
      name: 'Juan Lopez',
      password: 'prof123',
      role: 'professor',
      university_id: 'utn',
      deleted: false,
    });
    await professor2.save();
    users.push(professor2);
    console.log('   OK professor: prof-lopez / prof123');

    const professor3 = new User({
      username: 'prof-martinez',
      name: 'Carlos Martinez',
      password: 'prof123',
      role: 'professor',
      university_id: 'utn',
      deleted: false,
    });
    await professor3.save();
    users.push(professor3);
    console.log('   OK professor: prof-martinez / prof123');

    const regularUser = new User({
      username: 'usuario',
      name: 'Usuario Regular',
      password: 'usuario123',
      role: 'user',
      university_id: 'utn',
      deleted: false,
    });
    await regularUser.save();
    users.push(regularUser);
    console.log('   OK user: usuario / usuario123 (solo correccion)');

    // 6. Comisiones
    console.log('\n>>> Creando comisiones (4 por materia)...');
    const commissions = [];
    for (const course of courses) {
      for (let i = 1; i <= 4; i++) {
        commissions.push({
          commission_id: `${course.course_id}-comision-${i}`,
          name: `Comision ${i} - ${course.name}`,
          course_id: course.course_id,
          career_id: course.career_id,
          faculty_id: course.faculty_id,
          university_id: course.university_id,
          year: course.year,
          professors: [],
        });
      }
    }
    const createdCommissions = await Commission.insertMany(commissions);
    console.log(`OK  ${createdCommissions.length} comisiones creadas\n`);
    if (seedDriveEnabled) {
      const commissionResults = await Promise.allSettled(
        createdCommissions.map(c =>
          driveService.createCommissionFolder(
            c.commission_id,
            c.course_id,
            c.career_id,
            c.faculty_id,
            c.university_id
          )
        )
      );
      commissionResults.forEach((res, idx) =>
        trackDriveResult('commissions', createdCommissions[idx].commission_id, res.status === 'fulfilled' ? res.value : null, res.reason)
      );
    }

    // 7. Rubricas
    console.log('>>> Migrando rubricas...');
    const rubrics = [];

    const prog1Commissions = createdCommissions.filter(c => c.course_id.endsWith('-programacion-1'));
    for (const commission of prog1Commissions) {
      const course = courses.find(c => c.course_id === commission.course_id);
      rubrics.push({
        rubric_id: Rubric.generateRubricId(commission.commission_id, RUBRIC_TYPES.TP, 'TP Listas', 1),
        name: 'TP Listas',
        commission_id: commission.commission_id,
        course_id: commission.course_id,
        career_id: commission.career_id,
        faculty_id: commission.faculty_id,
        university_id: commission.university_id,
        rubric_type: RUBRIC_TYPES.TP,
        rubric_number: 1,
        year: course.year,
        rubric_json: rubric1JSON,
        source: 'manual',
      });
    }

    const prog2Commissions = createdCommissions.filter(c => c.course_id.endsWith('-programacion-2'));
    for (const commission of prog2Commissions) {
      const course = courses.find(c => c.course_id === commission.course_id);
      rubrics.push({
        rubric_id: Rubric.generateRubricId(commission.commission_id, RUBRIC_TYPES.PARCIAL_1, 'Parcial 1 - Programacion 2', 1),
        name: 'Parcial 1 - Programacion 2',
        commission_id: commission.commission_id,
        course_id: commission.course_id,
        career_id: commission.career_id,
        faculty_id: commission.faculty_id,
        university_id: commission.university_id,
        rubric_type: RUBRIC_TYPES.PARCIAL_1,
        rubric_number: 1,
        year: course.year,
        rubric_json: rubric2JSON,
        source: 'manual',
      });
    }

    const createdRubrics = await Rubric.insertMany(rubrics);
    console.log(`OK  ${createdRubrics.length} rubricas creadas\n`);

    // 8. Asignar profesores
    console.log('>>> Asignando profesores a comisiones...\n');
    const assignProfessorToCommissions = async (filterFn, professor, label) => {
      const filtered = createdCommissions.filter(filterFn);
      for (const commission of filtered) {
        await commission.assignProfessor(professor._id);
        console.log(`   OK ${label} -> ${commission.name}`);
      }
    };

    await assignProfessorToCommissions(c => c.course_id.endsWith('-programacion-1'), professor1, 'Maria Garcia');
    await assignProfessorToCommissions(c => c.course_id.endsWith('-programacion-2'), professor2, 'Juan Lopez');
    await assignProfessorToCommissions(c => c.course_id.endsWith('-programacion-3'), professor3, 'Carlos Martinez');
    console.log('');

    // Resumen
    console.log('='.repeat(80));
    console.log('OK  MIGRACION COMPLETADA - SEED SIMPLIFICADO (UTN/FRM)');
    console.log('='.repeat(80));
    console.log('Resumen MongoDB:');
    console.log(`   - Universidades: ${createdUniversities.length}`);
    console.log(`   - Facultades: ${createdFaculties.length}`);
    console.log(`   - Carreras: ${createdCareers.length}`);
    console.log(`   - Cursos: ${createdCourses.length}`);
    console.log(`   - Comisiones: ${createdCommissions.length}`);
    console.log(`   - Rubricas: ${createdRubrics.length}`);
    console.log(`   - Usuarios: ${users.length}`);
    console.log('='.repeat(80));
    if (seedDriveEnabled) {
      console.log('Resumen Google Drive:');
      console.log(`   - Universidades: ${driveStats.universities.success}/${createdUniversities.length} (fallos: ${driveStats.universities.failed})`);
      console.log(`   - Facultades: ${driveStats.faculties.success}/${createdFaculties.length} (fallos: ${driveStats.faculties.failed})`);
      console.log(`   - Carreras: ${driveStats.careers.success}/${createdCareers.length} (fallos: ${driveStats.careers.failed})`);
      console.log(`   - Cursos: ${driveStats.courses.success}/${createdCourses.length} (fallos: ${driveStats.courses.failed})`);
      console.log(`   - Comisiones (+Entregas/Rubricas): ${driveStats.commissions.success}/${createdCommissions.length} (fallos: ${driveStats.commissions.failed})`);
    } else {
      console.log('WARN SEED_CREATE_DRIVE_FOLDERS esta desactivado. Solo se creo la estructura en MongoDB.');
    }
    console.log('='.repeat(80));
    console.log('\nCredenciales de acceso:');
    console.log('   SUPER-ADMIN: superadmin / admin123');
    console.log('   UNIVERSITY-ADMIN: admin-utn / admin123');
    console.log('   FACULTY-ADMIN: admin-frm / admin123 (first_login=true)');
    console.log('   PROFESSOR-ADMIN:');
    console.log('      jefe-prog1-frm / admin123 (Programacion 1 ISI)');
    console.log('      jefe-prog2-frm / admin123 (Programacion 2 ISI)');
    console.log('      jefe-prog1-tup / admin123 (Programacion 1 TUP)');
    console.log('   PROFESSORS:');
    console.log('      prof-garcia / prof123 (Programacion 1)');
    console.log('      prof-lopez / prof123 (Programacion 2)');
    console.log('      prof-martinez / prof123 (Programacion 3)');
    console.log('   USER: usuario / usuario123');
    console.log('\nNOTA: Usuarios con first_login=true deben cambiar la contrasena en el primer acceso.');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('ERR  Error en migracion:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedDatabase();
