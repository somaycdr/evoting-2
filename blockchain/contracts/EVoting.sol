// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EVoting - Decentralized E-Voting System
 * BLOCKCHAIN PRINCIPLE: IMMUTABILITY
 * Every vote is permanently recorded. No authority can alter votes after submission.
 *
 * BLOCKCHAIN PRINCIPLE: DECENTRALIZATION
 * Runs on thousands of nodes. No single point of failure or control.
 */
contract EVoting {

    address public admin;
    bool public electionActive;
    string public electionName;
    uint256 public electionEndTime;
    uint256 private candidateCount;

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string description;
        uint256 voteCount;
        bool exists;
    }

    struct VoteReceipt {
        address voter;
        uint256 candidateId;
        uint256 timestamp;
        uint256 blockNumber;
        bytes32 receiptHash;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => VoteReceipt) public voteReceipts;
    mapping(bytes32 => VoteReceipt) public receiptByHash;
    uint256[] public candidateIds;

    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event VoteCast(address indexed voter, uint256 indexed candidateId, bytes32 receiptHash, uint256 timestamp);
    event ElectionStarted(string electionName, uint256 endTime);
    event ElectionEnded(uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "EVoting: Only admin can call this function");
        _;
    }

    modifier electionIsActive() {
        require(electionActive, "EVoting: Election is not currently active");
        require(block.timestamp < electionEndTime, "EVoting: Election time has ended");
        _;
    }

    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "EVoting: This address has already cast a vote");
        _;
    }

    constructor(string memory _electionName) {
        admin = msg.sender;
        electionName = _electionName;
        electionActive = false;
        candidateCount = 0;
    }

    function addCandidate(string memory _name, string memory _party, string memory _description) external onlyAdmin {
        require(!electionActive, "EVoting: Cannot add candidates after election starts");
        require(bytes(_name).length > 0, "EVoting: Candidate name cannot be empty");
        candidateCount++;
        candidates[candidateCount] = Candidate({ id: candidateCount, name: _name, party: _party, description: _description, voteCount: 0, exists: true });
        candidateIds.push(candidateCount);
        emit CandidateAdded(candidateCount, _name, _party);
    }

    function startElection(uint256 _durationMinutes) external onlyAdmin {
        require(!electionActive, "EVoting: Election already active");
        require(candidateCount >= 2, "EVoting: Need at least 2 candidates");
        require(_durationMinutes > 0, "EVoting: Duration must be positive");
        electionActive = true;
        electionEndTime = block.timestamp + (_durationMinutes * 60);
        emit ElectionStarted(electionName, electionEndTime);
    }

    function endElection() external onlyAdmin {
        require(electionActive, "EVoting: Election is not active");
        electionActive = false;
        electionEndTime = block.timestamp;
        emit ElectionEnded(block.timestamp);
    }

    function castVote(uint256 _candidateId) external electionIsActive hasNotVoted {
        require(candidates[_candidateId].exists, "EVoting: Invalid candidate ID");
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        bytes32 receiptHash = keccak256(abi.encodePacked(msg.sender, _candidateId, block.timestamp, block.number, blockhash(block.number - 1)));
        VoteReceipt memory receipt = VoteReceipt({ voter: msg.sender, candidateId: _candidateId, timestamp: block.timestamp, blockNumber: block.number, receiptHash: receiptHash });
        voteReceipts[msg.sender] = receipt;
        receiptByHash[receiptHash] = receipt;
        emit VoteCast(msg.sender, _candidateId, receiptHash, block.timestamp);
    }

    function getCandidateCount() external view returns (uint256) { return candidateCount; }

    function getCandidate(uint256 _candidateId) external view returns (uint256, string memory, string memory, string memory, uint256) {
        require(candidates[_candidateId].exists, "EVoting: Candidate not found");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.party, c.description, c.voteCount);
    }

    function getAllCandidateIds() external view returns (uint256[] memory) { return candidateIds; }

    function getMyReceipt(address _voter) external view returns (address, uint256, uint256, uint256, bytes32) {
        require(hasVoted[_voter], "EVoting: This address has not voted");
        VoteReceipt memory r = voteReceipts[_voter];
        return (r.voter, r.candidateId, r.timestamp, r.blockNumber, r.receiptHash);
    }

    function verifyByReceiptHash(bytes32 _receiptHash) external view returns (bool, address, uint256, uint256, uint256) {
        VoteReceipt memory r = receiptByHash[_receiptHash];
        bool valid = r.voter != address(0);
        return (valid, r.voter, r.candidateId, r.timestamp, r.blockNumber);
    }

    function getElectionStats() external view returns (string memory, bool, uint256, uint256, uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < candidateIds.length; i++) { total += candidates[candidateIds[i]].voteCount; }
        return (electionName, electionActive, electionEndTime, candidateCount, total);
    }
}
