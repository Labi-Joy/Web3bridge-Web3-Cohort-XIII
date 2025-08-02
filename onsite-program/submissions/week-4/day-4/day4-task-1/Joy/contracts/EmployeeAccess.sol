// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract EmployAccess {
    struct Employee {
        string name;
        EmployeeRole role;
        bool isEmployed;
    }
    enum EmployeeRole {
        MEDIA_TEAM,
        MANAGER,
        MENTOR,
        SOCIAL_TEAM,
        TECHNICIAN_SUPERVISOR,
        KITCHEN_STAFF
    }
    //mapping employees to their contracts
    mapping(address => Employee) public employees;

    //does the same as the mapping
    address[] public employeeAddresses;


    address owner;
     
    //events for login actions
    event EmployeeAdded(address indexed employeeAddress, string name, EmployeeRole role);
    event EmployeeUpdated(address indexed employeeAddress,string name,EmployeeRole role, bool isEmployed);
    event AccessAttempt(address indexed employeeAddress, bool accessGranted);

    constructor() {
        owner = msg.sender;
    }


    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    function addOrUpdateEmployee(address _employeeAddress, string memory _name, EmployeeRole _role, bool _isEmployed) public onlyOwner {
        require(_employeeAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name cannot be empty");

       //to check if employee exists
        bool employeeExists = bytes(employees[_employeeAddress].name).length > 0;

        // to update employee details
        employees[_employeeAddress] = Employee({
            name: _name,
            role: _role,
            isEmployed: _isEmployed
        });

        // to add new employers to array
        if (!employeeExists) {
            employeeAddresses.push(_employeeAddress);
            emit EmployeeAdded(_employeeAddress, _name, _role);
        } else {
            emit EmployeeUpdated(_employeeAddress, _name, _role, _isEmployed);
        }
    }

   
    function checkGarageAccess(address _employeeAddress) public returns (bool) {
        Employee memory employee = employees[_employeeAddress];

        // Check if employee exists
        require(
            bytes(employee.name).length > 0, "Employee not found"
            );

        // Terminated employees can NEVER have access
        if (!employee.isEmployed) {
            emit AccessAttempt(_employeeAddress, false);
            return false;
        }

        // Check if role has access to garage
        bool hasAccess = (employee.role == EmployeeRole.MEDIA_TEAM ||
            employee.role == EmployeeRole.MANAGER ||
            employee.role == EmployeeRole.MENTOR);

        emit AccessAttempt(_employeeAddress, hasAccess);
        return hasAccess;
    }

    
    function getAllEmployees() public view returns (address[] memory) {
        return employeeAddresses;
    }

    function getEmployeeDetails(
        address _employeeAddress
    ) public view returns (Employee memory) {
        require(
            bytes(employees[_employeeAddress].name).length > 0,"Employee not found"
        );
        return employees[_employeeAddress];
    }

   
    function getTotalEmployees() public view returns (uint256) {
        return employeeAddresses.length;
    }

 
    function getRoleName(EmployeeRole _role) public pure returns (string memory) {
        if (_role == EmployeeRole.MEDIA_TEAM)
             return "Media Team";
        if (_role == EmployeeRole.MANAGER) 
             return "Manager";
        if (_role == EmployeeRole.MENTOR) 
             return "Mentor";
        if (_role == EmployeeRole.SOCIAL_TEAM) 
             return "Social Team";
        if (_role == EmployeeRole.TECHNICIAN_SUPERVISOR)
            return "Technician Supervisor";
        if (_role == EmployeeRole.KITCHEN_STAFF) 
            return "Kitchen Staff";
            
        return "You are not an employee";
    }
}
