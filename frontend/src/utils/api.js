import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const fetchCandidates = () => api.get("/candidates").then((r) => r.data);

export const fetchCandidateById = (id) =>
  api.get(`/candidates/${id}`).then((r) => r.data);

export const seedCandidates = () =>
  api.post("/candidates/seed").then((r) => r.data);

export const recordVote = ({ txHash, voterAddress, candidateId, candidateName }) =>
  api
    .post("/votes/record", { txHash, voterAddress, candidateId, candidateName })
    .then((r) => r.data);

export const verifyTransaction = (txHash) =>
  api.get(`/votes/verify/${txHash}`).then((r) => r.data);

export const fetchElectionStats = () =>
  api.get("/votes/stats").then((r) => r.data);

export const fetchAuditLog = (page = 1) =>
  api.get(`/votes/audit?page=${page}`).then((r) => r.data);

export const checkHealth = () => api.get("/health").then((r) => r.data);

export default api;
