const express = require('express');
const { deleteStudentData, deleteSubjectData , deleteAllCollections } = require('../Controllers/delete.controller');

const router = express.Router();

// DELETE /delete/students?year=BE&examType=normal&courseType=Regular
router.delete('/students', deleteStudentData);

// DELETE /delete/subjects?year=BE&semester=7
router.delete('/subjects', deleteSubjectData);

router.delete('/all', deleteAllCollections);

module.exports = router;
