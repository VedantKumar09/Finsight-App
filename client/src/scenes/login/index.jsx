import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Alert,
} from "@mui/material";
import { useLoginMutation } from "@/state/api";
import DashboardBox from "@/components/DashboardBox";

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const result = await login(formData).unwrap();
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/");
      window.location.reload();
    } catch (err) {
      setErrorMessage(err?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      <DashboardBox width="400px" p="2rem">
        <Typography variant="h3" mb="1.5rem" textAlign="center">
          Login
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: "1rem" }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: "1rem" }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            sx={{ mb: "1.5rem" }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              backgroundColor: theme.palette.primary[500],
              color: theme.palette.grey[900],
              "&:hover": {
                backgroundColor: theme.palette.primary[600],
              },
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <Typography
          variant="h6"
          textAlign="center"
          mt="1.5rem"
          sx={{ color: theme.palette.grey[400] }}
        >
          Don't have an account?{" "}
          <Button
            onClick={() => navigate("/register")}
            sx={{
              color: theme.palette.primary[500],
              textTransform: "none",
            }}
          >
            Register
          </Button>
        </Typography>
      </DashboardBox>
    </Box>
  );
};

export default Login;

