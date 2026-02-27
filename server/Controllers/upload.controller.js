const xlsx = require("xlsx");
const createStudentModel = require("../Models/attendance.students.model");
const mongoose = require("mongoose");

const uploadExcel = async (req, res) => {
  try {
    const {
      year,
      semester,
      type: courseType,
      batch,
      selectedSubjects = [],
    } = req.body;

    // Validate required fields
    if (!year || !semester || !courseType || !batch) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Excel files uploaded.",
      });
    }

    // Parse selectedSubjects if sent as JSON string
    let parsedSelectedSubjects = selectedSubjects;
    if (typeof selectedSubjects === "string") {
      try {
        parsedSelectedSubjects = JSON.parse(selectedSubjects);
      } catch {
        parsedSelectedSubjects = [];
      }
    }

    const collectionName = `${year}_${courseType}_Data`;
    const StudentModel = createStudentModel(collectionName);

    let allStudents = [];

    // Process each uploaded Excel file (from memory buffer)
    for (const file of req.files) {
      const match = file.originalname.match(/(I1|I2|I3)/i);
      const division = match ? match[1].toUpperCase() : "UNKNOWN";

      const workbook = xlsx.read(file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1] && data[i][2] && data[i][3]) {
          allStudents.push({
            srNo: data[i][0],
            rollNo: data[i][1],
            sapId: data[i][2],
            name: data[i][3],
            division,
            semester: Number(semester),
            courseType,
            batch,
            selectedSubjects:
              courseType === "Regular"
                ? []
                : [...parsedSelectedSubjects],
          });
        }
      }
    }

    // Assign global serial number
    allStudents = allStudents.map((student, index) => ({
      ...student,
      globSrNo: index + 1,
    }));

    // ==============================
    // ELECTIVE TYPES (ILE, DLE, OE)
    // ==============================
    if (["ILE", "DLE", "OE"].includes(courseType)) {
      let updatedCount = 0;
      let newCount = 0;

      for (const student of allStudents) {
        const existing = await StudentModel.findOne({
          sapId: student.sapId,
        });

        if (existing) {
          const newSubjects = student.selectedSubjects.filter(
            (subj) => !existing.selectedSubjects.includes(subj)
          );

          if (newSubjects.length > 0) {
            await StudentModel.updateOne(
              { sapId: student.sapId },
              {
                $addToSet: {
                  selectedSubjects: { $each: newSubjects },
                },
              }
            );
            updatedCount++;
          }
        } else {
          await StudentModel.create(student);
          newCount++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Elective upload successful for ${collectionName}. Updated: ${updatedCount}, New: ${newCount}`,
      });
    }

    // ==============================
    // REGULAR TYPE (Overwrite)
    // ==============================
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection(collectionName);
    }

    if (allStudents.length > 0) {
      await StudentModel.insertMany(allStudents);
    }

    return res.status(200).json({
      success: true,
      message: `Regular upload successful. Inserted ${allStudents.length} records into ${collectionName}`,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Upload failed.",
      error: error.message,
    });
  }
};

module.exports = {
  uploadExcel,
};