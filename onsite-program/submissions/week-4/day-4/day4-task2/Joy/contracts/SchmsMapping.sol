//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//contract w/o mapping
// contract SchoolManagement {
//     error STUDENT_NOT_FOUND();
//     error INVALID_STUDENT_ID();
    
//     enum Status {
//         ACTIVE,
//         DEFERRED,
//         RUSTICATED
//     }
    
//     struct StudentDetails {
//         uint id;
//         string name;
//         string course;
//         uint age;
//         Status status;
//     }
    
//     StudentDetails[] public students;
//     uint256 private uid;
    
//     function registerStudents(string memory _name, string memory _course, uint _age) external {
//         uid = uid + 1;
//         StudentDetails memory newStudent = StudentDetails(uid, _name, _course, _age, Status.ACTIVE);
//         students.push(newStudent);
//     }
    
//     function updateStudent(uint256 _studentId, string memory _newName, string memory _newCourse, uint _newAge) external {
//         require(_studentId > 0 && _studentId <= uid, "Invalid student ID");
        
//         for (uint i = 0; i < students.length; i++) {
//             if (students[i].id == _studentId) {
//                 students[i].name = _newName;
//                 students[i].course = _newCourse;
//                 students[i].age = _newAge;
//                 return;
//             }
//         }
//         revert STUDENT_NOT_FOUND();
//     }
    
//     function get_student_by_id(uint256 _studentId) external view returns (StudentDetails memory) {
//         require(_studentId > 0 && _studentId <= uid, "Invalid student ID");
        
//         for (uint256 i = 0; i < students.length; i++) {
//             if (students[i].id == _studentId) {
//                 return students[i];
//             }
//         }
//         revert STUDENT_NOT_FOUND();
//     }
    
//     function update_student_status(uint256 _studentId, Status _newStatus) external {
//         require(_studentId > 0 && _studentId <= uid, "Invalid student ID");
        
//         for (uint i = 0; i < students.length; i++) {
//             if (students[i].id == _studentId) {
//                 students[i].status = _newStatus;
//                 return;
//             }
//         }
//         revert STUDENT_NOT_FOUND();
//     }
    
//     function get_students() external view returns (StudentDetails[] memory) {
//         return students;
//     }
    
//     function delete_student(uint256 _studentId) external {
//         require(_studentId > 0 && _studentId <= uid, "Invalid student ID");
        
//         for (uint256 i = 0; i < students.length; i++) {
//             if (students[i].id == _studentId) {
//                 students[i] = students[students.length - 1];
//                 students.pop();
//                 return;
//             }
//         }
//         revert STUDENT_NOT_FOUND();
//     }
    
//     function getStudentCount() external view returns (uint256) {
//         return students.length;
//     }
// }

//contract with mapping

contract SchoolManagement {
    error STUDENT_NOT_FOUND();
    error INVALID_STUDENT_ID();
    error STUDENT_ALREADY_EXISTS();
    
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }
    
    struct StudentDetails {
        uint id;
        string name;
        string course;
        uint age;
        Status status;
        bool exists;
    }
    
    mapping(uint256 => StudentDetails) public students;
    uint256[] public studentIds;
    uint256 private uid;
    
    function registerStudents(string memory _name, string memory _course, uint _age) external {
        uid = uid + 1;
        
        if (students[uid].exists) {
            revert STUDENT_ALREADY_EXISTS();
        }
        
        students[uid] = StudentDetails(uid, _name, _course, _age, Status.ACTIVE, true);
        studentIds.push(uid);
    }
    
    function updateStudent(uint256 _studentId, string memory _newName, string memory _newCourse, uint _newAge) external {
        if (!students[_studentId].exists) {
            revert STUDENT_NOT_FOUND();
        }
        
        students[_studentId].name = _newName;
        students[_studentId].course = _newCourse;
        students[_studentId].age = _newAge;
    }
    
    function get_student_by_id(uint256 _studentId) external view returns (StudentDetails memory) {
        if (!students[_studentId].exists) {
            revert STUDENT_NOT_FOUND();
        }
        
        return students[_studentId];
    }
    
    function update_student_status(uint256 _studentId, Status _newStatus) external {
        if (!students[_studentId].exists) {
            revert STUDENT_NOT_FOUND();
        }
        
        students[_studentId].status = _newStatus;
    }
    
    function get_students() external view returns (StudentDetails[] memory) {
        StudentDetails[] memory allStudents = new StudentDetails[](studentIds.length);
        
        for (uint256 i = 0; i < studentIds.length; i++) {
            allStudents[i] = students[studentIds[i]];
        }
        
        return allStudents;
    }
    
    function delete_student(uint256 _studentId) external {
        if (!students[_studentId].exists) {
            revert STUDENT_NOT_FOUND();
        }
        
        delete students[_studentId];
        
        for (uint256 i = 0; i < studentIds.length; i++) {
            if (studentIds[i] == _studentId) {
                studentIds[i] = studentIds[studentIds.length - 1];
                studentIds.pop();
                break;
            }
        }
    }
    
    function getStudentCount() external view returns (uint256) {
        return studentIds.length;
    }
    
    function studentExists(uint256 _studentId) external view returns (bool) {
        return students[_studentId].exists;
    }
}