import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PixIcon from "@mui/icons-material/Pix";
import LogoutIcon from "@mui/icons-material/Logout";
import { Box, Typography, useTheme, Button } from "@mui/material";
import FlexBetween from "@/components/FlexBetween";

const NAV_LINKS = [
  { key: "home", label: "home", path: "/" },
  { key: "dashboard", label: "dashboard", path: "/dashboard" },
  { key: "simulator", label: "simulator", path: "/simulator" },
  { key: "stock-ai", label: "stock AI", path: "/stock-predictions" },
];

const Navbar = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    const match = NAV_LINKS.find((link) => link.path === location.pathname);
    if (match) {
      setSelected(match.key);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <FlexBetween mb="0.25rem" p="0.5rem 0rem" color={palette.grey[300]}>
      {/* LEFT SIDE */}
      <FlexBetween gap="0.75rem">
        <PixIcon sx={{ fontSize: "28px", color: palette.primary[500] }} />
        <Typography variant="h4" fontSize="18px" fontWeight="bold" sx={{ letterSpacing: "1.5px" }}>
          FINSIGHT
        </Typography>
      </FlexBetween>

      {/* RIGHT SIDE */}
      <FlexBetween gap="2rem">
        {NAV_LINKS.map((link) => (
          <Box key={link.key} sx={{ "&:hover": { color: palette.primary[100] } }}>
            <Link
              to={link.path}
              onClick={() => setSelected(link.key)}
              style={{
                color: selected === link.key ? palette.primary[500] : palette.grey[700],
                fontWeight: selected === link.key ? "bold" : "normal",
                textDecoration: "inherit",
                fontSize: "14px",
              }}
            >
              {link.label}
            </Link>
          </Box>
        ))}
        {user && (
          <Box display="flex" alignItems="center" gap="1rem">
            <Typography variant="h6" fontSize="14px" sx={{ color: palette.primary[300] }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Button
              onClick={handleLogout}
              sx={{
                color: palette.grey[300],
                "&:hover": { color: palette.primary[100] },
              }}
            >
              <LogoutIcon />
            </Button>
          </Box>
        )}
      </FlexBetween>
    </FlexBetween>
  );
};

export default Navbar;
