import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("StaffManagement Deployment", function () {
    async function deployStaffManagement() {
        const [admin, teacher1, teacher2, nonAdmin] = await hre.ethers.getSigners();
        
        const StaffManagement = await hre.ethers.getContractFactory("StaffManagement");
        const staffManagement = await StaffManagement.deploy();
        
        return { staffManagement, admin, teacher1, teacher2, nonAdmin };
    }

    describe("Contract Deployment", function () {
        it("Should set the correct admin", async function () {
            const { staffManagement, admin } = await loadFixture(deployStaffManagement);
            
            expect(await staffManagement.admin()).to.equal(admin.address);
        });

        it("Should have zero teachers initially", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            expect(await staffManagement.get_teacher_count()).to.equal(0);
        });

        it("Should have zero contract balance initially", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            expect(await staffManagement.get_contract_balance()).to.equal(0);
        });
    });

    describe("Teacher Registration", function () {
        it("Should register a teacher successfully", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            const name = "Alice Johnson";
            const subject = "Mathematics";
            const salary = hre.ethers.parseEther("1.0");
            
            await staffManagement.register_teacher(name, subject, salary);
            
            const teacherDetails = await staffManagement.get_teacher_by_id(1);
            
            expect(teacherDetails[1]).to.equal(name); // name
            expect(teacherDetails[2]).to.equal(subject); // subject
            expect(teacherDetails[3]).to.equal(salary); // salary
            expect(teacherDetails[4]).to.equal(2); // status (PROBATION = 2)
            expect(teacherDetails[5]).to.equal(false); // salaryPaid
        });

        it("Should increment teacher count after registration", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            expect(await staffManagement.get_teacher_count()).to.equal(1);
            
            await staffManagement.register_teacher("Bob", "Science", hre.ethers.parseEther("1.2"));
            expect(await staffManagement.get_teacher_count()).to.equal(2);
        });

        it("Should revert if non-admin tries to register teacher", async function () {
            const { staffManagement, nonAdmin } = await loadFixture(deployStaffManagement);
            
            await expect(
                staffManagement.connect(nonAdmin).register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"))
            ).to.be.revertedWithCustomError(staffManagement, "UNAUTHORIZED");
        });

        it("Should assign teacher address correctly", async function () {
            const { staffManagement, teacher1 } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            await staffManagement.assign_teacher_address(1, teacher1.address);
            
            const teacherDetails = await staffManagement.get_teacher_by_id(1);
            expect(teacherDetails[0]).to.equal(teacher1.address); // teacherAddress
            
            expect(await staffManagement.teacher_address_to_id(teacher1.address)).to.equal(1);
        });
    });

    describe("Teacher Status Management", function () {
        it("Should update teacher status successfully", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            
            // Update to EMPLOYED (0)
            await staffManagement.update_teacher_status(1, 0);
            const teacherDetails = await staffManagement.get_teacher_by_id(1);
            expect(teacherDetails[4]).to.equal(0); // EMPLOYED
        });

        it("Should reset salary status when teacher becomes unemployed", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            
            // Update to UNEMPLOYED (1)
            await staffManagement.update_teacher_status(1, 1);
            const teacherDetails = await staffManagement.get_teacher_by_id(1);
            expect(teacherDetails[4]).to.equal(1); // UNEMPLOYED
            expect(teacherDetails[5]).to.equal(false); // salaryPaid should be false
        });

        it("Should revert with invalid status", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            
            await expect(
                staffManagement.update_teacher_status(1, 5)
            ).to.be.revertedWithCustomError(staffManagement, "INVALID_STATUS");
        });

        it("Should revert if teacher doesn't exist", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await expect(
                staffManagement.update_teacher_status(999, 0)
            ).to.be.revertedWithCustomError(staffManagement, "TEACHER_NOT_FOUND");
        });
    });

    describe("Salary Management", function () {
        it("Should update teacher salary successfully", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            const initialSalary = hre.ethers.parseEther("1.0");
            const newSalary = hre.ethers.parseEther("1.5");
            
            await staffManagement.register_teacher("Alice", "Math", initialSalary);
            await staffManagement.update_teacher_salary(1, newSalary);
            
            expect(await staffManagement.get_teacher_salary(1)).to.equal(newSalary);
        });

        it("Should disburse salary successfully", async function () {
            const { staffManagement, teacher1, admin } = await loadFixture(deployStaffManagement);
            
            const salary = hre.ethers.parseEther("1.0");
            
            // Register and setup teacher
            await staffManagement.register_teacher("Alice", "Math", salary);
            await staffManagement.assign_teacher_address(1, teacher1.address);
            await staffManagement.update_teacher_status(1, 0); // EMPLOYED
            
            // Fund the contract
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: hre.ethers.parseEther("2.0")
            });
            
            const initialBalance = await hre.ethers.provider.getBalance(teacher1.address);
            
            // Disburse salary
            await staffManagement.disburse_salary(1);
            
            const finalBalance = await hre.ethers.provider.getBalance(teacher1.address);
            expect(finalBalance - initialBalance).to.equal(salary);
            
            // Check salary paid status
            const teacherDetails = await staffManagement.get_teacher_by_id(1);
            expect(teacherDetails[5]).to.equal(true); // salaryPaid
        });

        it("Should revert if salary already paid", async function () {
            const { staffManagement, teacher1, admin } = await loadFixture(deployStaffManagement);
            
            const salary = hre.ethers.parseEther("1.0");
            
            await staffManagement.register_teacher("Alice", "Math", salary);
            await staffManagement.assign_teacher_address(1, teacher1.address);
            await staffManagement.update_teacher_status(1, 0); // EMPLOYED
            
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: hre.ethers.parseEther("2.0")
            });
            
            await staffManagement.disburse_salary(1);
            
            await expect(
                staffManagement.disburse_salary(1)
            ).to.be.revertedWithCustomError(staffManagement, "SALARY_ALREADY_PAID");
        });

        it("Should revert if teacher is unemployed", async function () {
            const { staffManagement, teacher1, admin } = await loadFixture(deployStaffManagement);
            
            const salary = hre.ethers.parseEther("1.0");
            
            await staffManagement.register_teacher("Alice", "Math", salary);
            await staffManagement.assign_teacher_address(1, teacher1.address);
            await staffManagement.update_teacher_status(1, 1); // UNEMPLOYED
            
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: hre.ethers.parseEther("2.0")
            });
            
            await expect(
                staffManagement.disburse_salary(1)
            ).to.be.revertedWithCustomError(staffManagement, "TEACHER_NOT_EMPLOYED");
        });

        it("Should revert if insufficient funds", async function () {
            const { staffManagement, teacher1 } = await loadFixture(deployStaffManagement);
            
            const salary = hre.ethers.parseEther("1.0");
            
            await staffManagement.register_teacher("Alice", "Math", salary);
            await staffManagement.assign_teacher_address(1, teacher1.address);
            await staffManagement.update_teacher_status(1, 0); // EMPLOYED
            
            await expect(
                staffManagement.disburse_salary(1)
            ).to.be.revertedWithCustomError(staffManagement, "INSUFFICIENT_FUNDS");
        });
    });

    describe("Batch Operations", function () {
        it("Should disburse all salaries correctly", async function () {
            const { staffManagement, teacher1, teacher2, admin } = await loadFixture(deployStaffManagement);
            
            const salary1 = hre.ethers.parseEther("1.0");
            const salary2 = hre.ethers.parseEther("1.2");
            
            // Register teachers
            await staffManagement.register_teacher("Alice", "Math", salary1);
            await staffManagement.register_teacher("Bob", "Science", salary2);
            
            // Assign addresses and set as employed
            await staffManagement.assign_teacher_address(1, teacher1.address);
            await staffManagement.assign_teacher_address(2, teacher2.address);
            await staffManagement.update_teacher_status(1, 0); // EMPLOYED
            await staffManagement.update_teacher_status(2, 0); // EMPLOYED
            
            // Fund contract
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: hre.ethers.parseEther("5.0")
            });
            
            const teacher1InitialBalance = await hre.ethers.provider.getBalance(teacher1.address);
            const teacher2InitialBalance = await hre.ethers.provider.getBalance(teacher2.address);
            
            await staffManagement.disburse_all_salaries();
            
            const teacher1FinalBalance = await hre.ethers.provider.getBalance(teacher1.address);
            const teacher2FinalBalance = await hre.ethers.provider.getBalance(teacher2.address);
            
            expect(teacher1FinalBalance - teacher1InitialBalance).to.equal(salary1);
            expect(teacher2FinalBalance - teacher2InitialBalance).to.equal(salary2);
        });

        it("Should reset all salary statuses", async function () {
            const { staffManagement, teacher1, admin } = await loadFixture(deployStaffManagement);
            
            const salary = hre.ethers.parseEther("1.0");
            
            await staffManagement.register_teacher("Alice", "Math", salary);
            await staffManagement.assign_teacher_address(1, teacher1.address);
            await staffManagement.update_teacher_status(1, 0); // EMPLOYED
            
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: hre.ethers.parseEther("2.0")
            });
            
            await staffManagement.disburse_salary(1);
            
            let teacherDetails = await staffManagement.get_teacher_by_id(1);
            expect(teacherDetails[5]).to.equal(true); // salaryPaid should be true
            
            await staffManagement.reset_salary_status();
            
            teacherDetails = await staffManagement.get_teacher_by_id(1);
            expect(teacherDetails[5]).to.equal(false); // salaryPaid should be false
        });
    });

    describe("Teacher Queries", function () {
        it("Should get all teachers correctly", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            await staffManagement.register_teacher("Bob", "Science", hre.ethers.parseEther("1.2"));
            
            const allTeachers = await staffManagement.get_all_teachers();
            expect(allTeachers.length).to.equal(2);
            expect(allTeachers[0].name).to.equal("Alice");
            expect(allTeachers[1].name).to.equal("Bob");
        });

        it("Should get only employed teachers", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            await staffManagement.register_teacher("Bob", "Science", hre.ethers.parseEther("1.2"));
            await staffManagement.register_teacher("Charlie", "History", hre.ethers.parseEther("1.1"));
            
            // Set statuses
            await staffManagement.update_teacher_status(1, 0); // EMPLOYED
            await staffManagement.update_teacher_status(2, 1); // UNEMPLOYED
            await staffManagement.update_teacher_status(3, 2); // PROBATION
            
            const employedTeachers = await staffManagement.get_employed_teachers();
            expect(employedTeachers.length).to.equal(2); // Alice and Charlie (not Bob who is unemployed)
            
            const employedNames = employedTeachers.map(teacher => teacher.name);
            expect(employedNames).to.include("Alice");
            expect(employedNames).to.include("Charlie");
            expect(employedNames).to.not.include("Bob");
        });

        it("Should check if teacher exists", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            
            expect(await staffManagement.teacher_exists(1)).to.equal(true);
            expect(await staffManagement.teacher_exists(999)).to.equal(false);
        });
    });

    describe("Teacher Deletion", function () {
        it("Should delete teacher successfully", async function () {
            const { staffManagement, teacher1 } = await loadFixture(deployStaffManagement);
            
            await staffManagement.register_teacher("Alice", "Math", hre.ethers.parseEther("1.0"));
            await staffManagement.assign_teacher_address(1, teacher1.address);
            
            expect(await staffManagement.get_teacher_count()).to.equal(1);
            expect(await staffManagement.teacher_exists(1)).to.equal(true);
            
            await staffManagement.delete_teacher(1);
            
            expect(await staffManagement.get_teacher_count()).to.equal(0);
            expect(await staffManagement.teacher_exists(1)).to.equal(false);
            expect(await staffManagement.teacher_address_to_id(teacher1.address)).to.equal(0);
        });

        it("Should revert when deleting non-existent teacher", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await expect(
                staffManagement.delete_teacher(999)
            ).to.be.revertedWithCustomError(staffManagement, "TEACHER_NOT_FOUND");
        });
    });

    describe("Contract Fund Management", function () {
        it("Should receive funds correctly", async function () {
            const { staffManagement, admin } = await loadFixture(deployStaffManagement);
            
            const amount = hre.ethers.parseEther("2.0");
            
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: amount
            });
            
            expect(await staffManagement.get_contract_balance()).to.equal(amount);
        });

        it("Should withdraw funds successfully", async function () {
            const { staffManagement, admin } = await loadFixture(deployStaffManagement);
            
            const amount = hre.ethers.parseEther("2.0");
            
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: amount
            });
            
            const initialAdminBalance = await hre.ethers.provider.getBalance(admin.address);
            
            const tx = await staffManagement.withdraw_funds();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const finalAdminBalance = await hre.ethers.provider.getBalance(admin.address);
            
            // Admin should receive the amount minus gas costs
            expect(finalAdminBalance - initialAdminBalance + gasUsed).to.equal(amount);
            expect(await staffManagement.get_contract_balance()).to.equal(0);
        });

        it("Should revert withdrawal if no funds", async function () {
            const { staffManagement } = await loadFixture(deployStaffManagement);
            
            await expect(
                staffManagement.withdraw_funds()
            ).to.be.revertedWith("No funds to withdraw");
        });

        it("Should revert withdrawal if not admin", async function () {
            const { staffManagement, nonAdmin, admin } = await loadFixture(deployStaffManagement);
            
            await admin.sendTransaction({
                to: await staffManagement.getAddress(),
                value: hre.ethers.parseEther("1.0")
            });
            
            await expect(
                staffManagement.connect(nonAdmin).withdraw_funds()
            ).to.be.revertedWithCustomError(staffManagement, "UNAUTHORIZED");
        });
    });
});