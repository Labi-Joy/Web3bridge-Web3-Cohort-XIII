// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
        bool exists;
    }
    
    mapping(uint256 => Todo) todos;
    
    uint256 todoCounter;
    uint256[] todoIds;
 
    event TodoCreated(uint256 indexed id, string title);
    event TodoUpdated(uint256 indexed id, string title);
    event TodoStatusToggled(uint256 indexed id, bool status);
    event TodoDeleted(uint256 indexed id);
    
    function createTodo(string memory _title, string memory _description) external {
        uint256 newId = todoCounter;
        
        todos[newId] = Todo({
            title: _title,
            description: _description,
            status: false,
            exists: true
        });
        
        todoIds.push(newId);
        todoCounter++;
        
        emit TodoCreated(newId, _title);
    }
    
    function updateTodo(uint256 _id, string memory _newTitle, string memory _newDescription) external {
        require(todos[_id].exists, "Todo does not exist");
        
        todos[_id].title = _newTitle;
        todos[_id].description = _newDescription;
        
        emit TodoUpdated(_id, _newTitle);
    }
    
    function toggleTodoStatus(uint256 _id) external {
        require(todos[_id].exists, "Todo does not exist");
        
        todos[_id].status = !todos[_id].status;
        
        emit TodoStatusToggled(_id, todos[_id].status);
    }
    
    function getTodo(uint256 _id) external view returns (string memory title, string memory description, bool status) {
        require(todos[_id].exists, "Todo does not exist");
        
        Todo memory todo = todos[_id];
        return (todo.title, todo.description, todo.status);
    }
    
    function getAllTodoIds() external view returns (uint256[] memory) {
        return todoIds;
    }
    
    function getTodoCount() external view returns (uint256) {
        return todoIds.length;
    }
    
    function deleteTodo(uint256 _id) external {
        require(todos[_id].exists, "Todo does not exist");
        todos[_id].exists = false;
    
        for (uint256 i = 0; i < todoIds.length; i++) {
            if (todoIds[i] == _id) {
                // Move last element to current position and pop
                todoIds[i] = todoIds[todoIds.length - 1];
                todoIds.pop();
                break;
            }
        }
        
        emit TodoDeleted(_id);
    }
    

    function getAllActiveTodos() external view returns (Todo[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < todoIds.length; i++) {
            if (todos[todoIds[i]].exists) {
                activeCount++;
            }
        }
        
        Todo[] memory activeTodos = new Todo[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < todoIds.length; i++) {
            if (todos[todoIds[i]].exists) {
                activeTodos[currentIndex] = todos[todoIds[i]];
                currentIndex++;
            }
        }
        
        return activeTodos;
    }
}