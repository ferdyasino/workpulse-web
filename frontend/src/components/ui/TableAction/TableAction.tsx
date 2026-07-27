import MoreVertIcon from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { useState } from "react";

type Props = {
  onEdit?: () => void;

  onActivate?: () => void;
  onDeactivate?: () => void;

  onDelete?: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
};

export default function TableAction({
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onRestore,
  onHardDelete,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (callback?: () => void) => {
    handleClose();

    callback?.();
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {onEdit && (
          <MenuItem onClick={() => handleClick(onEdit)}>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {onActivate && (
          <MenuItem onClick={() => handleClick(onActivate)}>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}

        {onDeactivate && (
          <MenuItem onClick={() => handleClick(onDeactivate)}>
            <ListItemText>Deactivate</ListItemText>
          </MenuItem>
        )}

        {onDelete && (
          <MenuItem onClick={() => handleClick(onDelete)}>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}

        {onRestore && (
          <MenuItem onClick={() => handleClick(onRestore)}>
            <ListItemText>Restore</ListItemText>
          </MenuItem>
        )}

        {onHardDelete && (
          <MenuItem
            onClick={() => handleClick(onHardDelete)}
            sx={{
              color: "error.main",
            }}
          >
            <ListItemText>Permanently Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
