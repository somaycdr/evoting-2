const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EVoting Contract", function () {
  let evoting, admin, voter1, voter2, voter3;

  beforeEach(async () => {
    [admin, voter1, voter2, voter3] = await ethers.getSigners();
    const EVoting = await ethers.getContractFactory("EVoting");
    evoting = await EVoting.deploy("Test Election 2025");
    await evoting.waitForDeployment();
  });

  it("Should set deployer as admin", async () => {
    expect(await evoting.admin()).to.equal(admin.address);
  });
  it("Election should not be active initially", async () => {
    expect(await evoting.electionActive()).to.be.false;
  });
  it("Admin can add candidates", async () => {
    await evoting.addCandidate("Alice", "Party A", "Desc A");
    expect(await evoting.getCandidateCount()).to.equal(1);
  });
  it("Non-admin cannot add candidates", async () => {
    await expect(evoting.connect(voter1).addCandidate("Bob", "Party B", "Desc B"))
      .to.be.revertedWith("EVoting: Only admin can call this function");
  });
  it("Voter can cast a vote", async () => {
    await evoting.addCandidate("Alice", "Party A", "Desc A");
    await evoting.addCandidate("Bob", "Party B", "Desc B");
    await evoting.startElection(60);
    await evoting.connect(voter1).castVote(1);
    expect(await evoting.hasVoted(voter1.address)).to.be.true;
  });
  it("Double-voting is prevented", async () => {
    await evoting.addCandidate("Alice", "Party A", "Desc A");
    await evoting.addCandidate("Bob", "Party B", "Desc B");
    await evoting.startElection(60);
    await evoting.connect(voter1).castVote(1);
    await expect(evoting.connect(voter1).castVote(1))
      .to.be.revertedWith("EVoting: This address has already cast a vote");
  });
  it("Vote count increments correctly", async () => {
    await evoting.addCandidate("Alice", "Party A", "Desc A");
    await evoting.addCandidate("Bob", "Party B", "Desc B");
    await evoting.startElection(60);
    await evoting.connect(voter1).castVote(1);
    await evoting.connect(voter2).castVote(1);
    await evoting.connect(voter3).castVote(2);
    const [,,,,count1] = await evoting.getCandidate(1);
    expect(count1).to.equal(2);
  });
});
