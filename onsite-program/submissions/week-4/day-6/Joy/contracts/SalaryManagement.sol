//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStaffManagement {
    function register_teacher(string memory _name, string memory _subject, uint256 _salary) external;
    function update_teacher_status(uint256 _teacherId, uint8 _newStatus) external;
    function get_teacher_by_id(uint256 _teacherId) external view returns (address, string memory, string memory, uint256, uint8, bool);
    function disburse_salary(uint256 _teacherId) external payable;
    function get_teacher_salary(uint256 _teacherId) external view returns (uint256);
}

contract StaffManagement is IStaffManagement {
    error TEACHER_NOT_FOUND();
    error TEACHER_NOT_EMPLOYED();
    error INSUFFICIENT_FUNDS();
    error SALARY_ALREADY_PAID();
    error INVALID_STATUS();
    error UNAUTHORIZED();

       struct TeacherDetails {
        uint256 id;
        address teacherAddress;
        string name;
        string subject;
        uint256 salary;
        EmploymentStatus status;
        bool exists;
        bool salaryPaid;
    }
    
    enum EmploymentStatus {
        EMPLOYED,        // 0
        UNEMPLOYED,      // 1  
        PROBATION        // 2
    }
    
    
    mapping(uint256 => TeacherDetails) public teachers;
    mapping(address => uint256) public teacher_address_to_id;
    uint256[] public teacherIds;
    uint256 private uid;
    address public admin;
    
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert UNAUTHORIZED();
        }
        _;
    }
    
    modifier teacherExists(uint256 _teacherId) {
        if (!teachers[_teacherId].exists) {
            revert TEACHER_NOT_FOUND();
        }
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    receive() external payable {}
    
    function register_teacher(string memory _name, string memory _subject, uint256 _salary) external override onlyAdmin {
        uid = uid + 1;
        
        teachers[uid] = TeacherDetails({
            id: uid,
            teacherAddress: address(0),
            name: _name,
            subject: _subject,
            salary: _salary,
            status: EmploymentStatus.PROBATION,
            exists: true,
            salaryPaid: false
        });
        
        teacherIds.push(uid);
    }
    
    function assign_teacher_address(uint256 _teacherId, address _teacherAddress) external onlyAdmin teacherExists(_teacherId) {
        teachers[_teacherId].teacherAddress = _teacherAddress;
        teacher_address_to_id[_teacherAddress] = _teacherId;
    }
    
    function update_teacher_status(uint256 _teacherId, uint8 _newStatus) external override onlyAdmin teacherExists(_teacherId) {
        if (_newStatus > 2) {
            revert INVALID_STATUS();
        }
        
        teachers[_teacherId].status = EmploymentStatus(_newStatus);
        
        if (_newStatus == 1) { // UNEMPLOYED
            teachers[_teacherId].salaryPaid = false;
        }
    }
    
    function update_teacher_salary(uint256 _teacherId, uint256 _newSalary) external onlyAdmin teacherExists(_teacherId) {
        teachers[_teacherId].salary = _newSalary;
    }
    
    function get_teacher_by_id(uint256 _teacherId) external view override teacherExists(_teacherId) returns (address, string memory, string memory, uint256, uint8, bool) {
        TeacherDetails memory teacher = teachers[_teacherId];
        return (
            teacher.teacherAddress,
            teacher.name,
            teacher.subject,
            teacher.salary,
            uint8(teacher.status),
            teacher.salaryPaid
        );
    }
    
    function get_teacher_salary(uint256 _teacherId) external view override teacherExists(_teacherId) returns (uint256) {
        return teachers[_teacherId].salary;
    }
    
    function disburse_salary(uint256 _teacherId) external payable override onlyAdmin teacherExists(_teacherId) {
        TeacherDetails storage teacher = teachers[_teacherId];
        
        if (teacher.status == EmploymentStatus.UNEMPLOYED) {
            revert TEACHER_NOT_EMPLOYED();
        }
        
        if (teacher.salaryPaid) {
            revert SALARY_ALREADY_PAID();
        }
        
        if (teacher.teacherAddress == address(0)) {
            revert TEACHER_NOT_FOUND();
        }
        
        uint256 salaryAmount = teacher.salary;
        
        if (address(this).balance < salaryAmount) {
            revert INSUFFICIENT_FUNDS();
        }
        
        teacher.salaryPaid = true;
        
        (bool success, ) = payable(teacher.teacherAddress).call{value: salaryAmount}("");
        require(success, "Payment failed");
    }
    
    function disburse_all_salaries() external onlyAdmin {
        for (uint256 i = 0; i < teacherIds.length; i++) {
            uint256 teacherId = teacherIds[i];
            TeacherDetails storage teacher = teachers[teacherId];
            
            if (teacher.exists && 
                teacher.status != EmploymentStatus.UNEMPLOYED && 
                !teacher.salaryPaid && 
                teacher.teacherAddress != address(0)) {
                
                uint256 salaryAmount = teacher.salary;
                
                if (address(this).balance >= salaryAmount) {
                    teacher.salaryPaid = true;
                    (bool success, ) = payable(teacher.teacherAddress).call{value: salaryAmount}("");
                    require(success, "Payment failed");
                }
            }
        }
    }
    
    function reset_salary_status() external onlyAdmin {
        for (uint256 i = 0; i < teacherIds.length; i++) {
            teachers[teacherIds[i]].salaryPaid = false;
        }
    }
    
    function get_all_teachers() external view returns (TeacherDetails[] memory) {
        TeacherDetails[] memory allTeachers = new TeacherDetails[](teacherIds.length);
        
        for (uint256 i = 0; i < teacherIds.length; i++) {
            allTeachers[i] = teachers[teacherIds[i]];
        }
        
        return allTeachers;
    }
    
    function get_employed_teachers() external view returns (TeacherDetails[] memory) {
        uint256 employedCount = 0;
        
        for (uint256 i = 0; i < teacherIds.length; i++) {
            if (teachers[teacherIds[i]].status != EmploymentStatus.UNEMPLOYED) {
                employedCount++;
            }
        }
        
        TeacherDetails[] memory employedTeachers = new TeacherDetails[](employedCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < teacherIds.length; i++) {
            if (teachers[teacherIds[i]].status != EmploymentStatus.UNEMPLOYED) {
                employedTeachers[currentIndex] = teachers[teacherIds[i]];
                currentIndex++;
            }
        }
        
        return employedTeachers;
    }
    
    function delete_teacher(uint256 _teacherId) external onlyAdmin teacherExists(_teacherId) {
        address teacherAddress = teachers[_teacherId].teacherAddress;
        
        delete teachers[_teacherId];
        
        if (teacherAddress != address(0)) {
            delete teacher_address_to_id[teacherAddress];
        }
        
        for (uint256 i = 0; i < teacherIds.length; i++) {
            if (teacherIds[i] == _teacherId) {
                teacherIds[i] = teacherIds[teacherIds.length - 1];
                teacherIds.pop();
                break;
            }
        }
    }
    
    function get_contract_balance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function get_teacher_count() external view returns (uint256) {
        return teacherIds.length;
    }
    
    function withdraw_funds() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(admin).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function teacher_exists(uint256 _teacherId) external view returns (bool) {
        return teachers[_teacherId].exists;
    }
}