/**
 * Seed Database - Datos iniciales para desarrollo
 * Estructura: UTN -> FRM -> 2 carreras -> 3 materias c/u -> 4 comisiones c/u
 * Solo crea datos en MongoDB (sin Drive)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../src/config/database.js';
import University from '../src/models/University.js';
import Faculty from '../src/models/Faculty.js';
import Career from '../src/models/Career.js';
import Course from '../src/models/Course.js';
import Commission from '../src/models/Commission.js';
import User from '../src/models/User.js';

dotenv.config();

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

// ============================================
// NOTA: Las rúbricas se crean manualmente desde el panel
// ============================================
// Las rúbricas ahora se crean manualmente por los usuarios
// ya que cada profesor tiene sus propias consignas y criterios.

const seedDatabase = async () => {
  try {
    console.log('>>> Iniciando seed de base de datos...\n');

    await connectDB();

    console.log('>>> Borrando base de datos completa (colecciones + indices)...');
    await mongoose.connection.dropDatabase();
    console.log('OK  Base eliminada completamente\n');

    console.log('>>> Creando universidades...');
    const createdUniversities = await University.insertMany(universities);
    console.log(`OK  ${createdUniversities.length} universidades creadas\n`);

    console.log('>>> Creando facultades...');
    const createdFaculties = await Faculty.insertMany(faculties);
    console.log(`OK  ${createdFaculties.length} facultades creadas\n`);

    console.log('>>> Creando carreras...');
    const createdCareers = await Career.insertMany(careers);
    console.log(`OK  ${createdCareers.length} carreras creadas\n`);

    console.log('>>> Creando cursos...');
    const createdCourses = await Course.insertMany(courses);
    console.log(`OK  ${createdCourses.length} cursos creados\n`);

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

    // Nota: Las rúbricas se crean manualmente desde el panel de administración
    console.log('>>> Rubricas: Se deben crear manualmente desde el panel de administración\n');

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
    console.log('✅  SEED COMPLETADO - BASE DE DATOS INICIALIZADA');
    console.log('='.repeat(80));
    console.log('Datos creados en MongoDB:');
    console.log(`   - Universidades: ${createdUniversities.length}`);
    console.log(`   - Facultades: ${createdFaculties.length}`);
    console.log(`   - Carreras: ${createdCareers.length}`);
    console.log(`   - Cursos: ${createdCourses.length}`);
    console.log(`   - Comisiones: ${createdCommissions.length}`);
    console.log(`   - Rubricas: 0 (crear manualmente desde el panel)`);
    console.log(`   - Usuarios: ${users.length}`);
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
