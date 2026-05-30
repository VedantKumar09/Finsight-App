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
import { useRegisterMutation } from "@/state/api";
import DashboardBox from "@/components/DashboardBox";

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (formData.password.length < 5) {
      setErrorMessage("Password must be at least 5 characters");
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData).unwrap();
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/");
      window.location.reload();
    } catch (err) {
      setErrorMessage(err?.data?.message || "Registration failed. Please try again.");
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
          Register
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: "1rem" }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            sx={{ mb: "1rem" }}
          />
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            sx={{ mb: "1rem" }}
          />
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
            sx={{ mb: "1rem" }}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
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
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </form>

        <Typography
          variant="h6"
          textAlign="center"
          mt="1.5rem"
          sx={{ color: theme.palette.grey[400] }}
        >
          Already have an account?{" "}
          <Button
            onClick={() => navigate("/login")}
            sx={{
              color: theme.palette.primary[500],
              textTransform: "none",
            }}
          >
            Login
          </Button>
        </Typography>
      </DashboardBox>
    </Box>
  );
};

export default Register;

