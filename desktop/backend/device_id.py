"""
Device identification utilities
Generates stable device IDs using multiple hardware identifiers.

This creates a fingerprint that is extremely hard to bypass by reinstalling the app.
We combine multiple hardware identifiers to create a unique hash.
"""
import uuid
import hashlib
import platform
import subprocess
import os
import json
from typing import Optional, Tuple, List

# ============================================
# In-Memory Cache
# ============================================
# Cache device identifiers to avoid SQLite access on every request
# This prevents "database is locked" errors
_cached_device_uuid: Optional[str] = None
_cached_hardware_id: Optional[str] = None


def get_mac_address() -> Optional[str]:
    """
    Get MAC address of the primary network interface
    This is a hardware identifier that persists across app reinstalls
    """
    try:
        if platform.system() == "Windows":
            # Windows: Use getmac command
            output = subprocess.check_output("getmac", shell=True).decode()
            # Parse first MAC address
            for line in output.split('\n'):
                if '-' in line or ':' in line:
                    parts = line.split()
                    if parts:
                        mac = parts[0].replace('-', ':').upper()
                        if mac.count(':') == 5:  # Valid MAC format
                            return mac

        elif platform.system() == "Darwin":
            # macOS: Use networksetup or ifconfig
            try:
                # Try networksetup first
                output = subprocess.check_output(
                    ["networksetup", "-listallhardwareports"],
                    stderr=subprocess.DEVNULL
                ).decode()

                lines = output.split('\n')
                for i, line in enumerate(lines):
                    if "Wi-Fi" in line or "Ethernet" in line:
                        # Next line should have MAC address
                        if i + 2 < len(lines):
                            mac_line = lines[i + 2]
                            if "Ethernet Address:" in mac_line:
                                mac = mac_line.split(":")[1].strip().upper()
                                return mac
            except:
                pass

            # Fallback to ifconfig
            output = subprocess.check_output(["ifconfig", "en0"]).decode()
            for line in output.split('\n'):
                if "ether" in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        return parts[1].upper()

        elif platform.system() == "Linux":
            # Linux: Read from /sys/class/net
            interfaces = os.listdir('/sys/class/net')
            for interface in ['eth0', 'en0', 'wlan0', 'wlp']:
                for iface in interfaces:
                    if iface.startswith(interface):
                        mac_file = f'/sys/class/net/{iface}/address'
                        if os.path.exists(mac_file):
                            with open(mac_file, 'r') as f:
                                return f.read().strip().upper()

    except Exception as e:
        print(f"[WARN] Failed to get MAC address: {e}")

    return None


def get_machine_uuid() -> Optional[str]:
    """
    Get machine UUID - a unique identifier assigned by the OS/hardware
    This is very hard to change without reinstalling the OS
    """
    try:
        if platform.system() == "Darwin":
            # macOS: Use system_profiler to get hardware UUID
            output = subprocess.check_output(
                ["system_profiler", "SPHardwareDataType"],
                stderr=subprocess.DEVNULL
            ).decode()
            for line in output.split('\n'):
                if "Hardware UUID:" in line:
                    return line.split(":")[1].strip()
                    
        elif platform.system() == "Windows":
            # Windows: Use WMIC to get machine GUID
            try:
                output = subprocess.check_output(
                    "wmic csproduct get uuid",
                    shell=True
                ).decode()
                lines = output.strip().split('\n')
                if len(lines) > 1:
                    uuid_val = lines[1].strip()
                    if uuid_val and uuid_val != "":
                        return uuid_val
            except:
                pass
                
        elif platform.system() == "Linux":
            # Linux: Read from /etc/machine-id or /var/lib/dbus/machine-id
            for path in ['/etc/machine-id', '/var/lib/dbus/machine-id']:
                if os.path.exists(path):
                    with open(path, 'r') as f:
                        return f.read().strip()
                        
    except Exception as e:
        print(f"[WARN] Failed to get machine UUID: {e}")
    
    return None


def get_disk_serial() -> Optional[str]:
    """
    Get the primary disk serial number
    This is a hardware identifier that survives OS reinstalls
    """
    try:
        if platform.system() == "Darwin":
            # macOS: Use diskutil
            output = subprocess.check_output(
                ["diskutil", "info", "/"],
                stderr=subprocess.DEVNULL
            ).decode()
            for line in output.split('\n'):
                if "Volume UUID:" in line or "Disk / Partition UUID:" in line:
                    return line.split(":")[1].strip()
                    
        elif platform.system() == "Windows":
            # Windows: Use WMIC
            try:
                output = subprocess.check_output(
                    "wmic diskdrive get serialnumber",
                    shell=True
                ).decode()
                lines = output.strip().split('\n')
                if len(lines) > 1:
                    serial = lines[1].strip()
                    if serial and serial != "":
                        return serial
            except:
                pass
                
        elif platform.system() == "Linux":
            # Linux: Read from /sys/block
            for disk in ['sda', 'nvme0n1', 'vda']:
                serial_path = f'/sys/block/{disk}/device/serial'
                if os.path.exists(serial_path):
                    with open(serial_path, 'r') as f:
                        return f.read().strip()
                        
    except Exception as e:
        print(f"[WARN] Failed to get disk serial: {e}")
    
    return None


def get_cpu_id() -> Optional[str]:
    """
    Get CPU identifier
    """
    try:
        if platform.system() == "Darwin":
            # macOS: Use sysctl
            output = subprocess.check_output(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                stderr=subprocess.DEVNULL
            ).decode().strip()
            return output
            
        elif platform.system() == "Windows":
            # Windows: Use WMIC
            try:
                output = subprocess.check_output(
                    "wmic cpu get processorid",
                    shell=True
                ).decode()
                lines = output.strip().split('\n')
                if len(lines) > 1:
                    cpu_id = lines[1].strip()
                    if cpu_id and cpu_id != "":
                        return cpu_id
            except:
                pass
                
        elif platform.system() == "Linux":
            # Linux: Read from /proc/cpuinfo
            if os.path.exists('/proc/cpuinfo'):
                with open('/proc/cpuinfo', 'r') as f:
                    for line in f:
                        if 'model name' in line.lower():
                            return line.split(':')[1].strip()
                            
    except Exception as e:
        print(f"[WARN] Failed to get CPU ID: {e}")
    
    return None


def get_motherboard_serial() -> Optional[str]:
    """
    Get motherboard/system serial number
    """
    try:
        if platform.system() == "Darwin":
            # macOS: Use system_profiler
            output = subprocess.check_output(
                ["system_profiler", "SPHardwareDataType"],
                stderr=subprocess.DEVNULL
            ).decode()
            for line in output.split('\n'):
                if "Serial Number" in line:
                    return line.split(":")[1].strip()
                    
        elif platform.system() == "Windows":
            # Windows: Use WMIC
            try:
                output = subprocess.check_output(
                    "wmic baseboard get serialnumber",
                    shell=True
                ).decode()
                lines = output.strip().split('\n')
                if len(lines) > 1:
                    serial = lines[1].strip()
                    if serial and serial != "" and serial.lower() != "to be filled by o.e.m.":
                        return serial
            except:
                pass
                
        elif platform.system() == "Linux":
            # Linux: Try dmidecode or /sys
            for path in ['/sys/class/dmi/id/board_serial', '/sys/class/dmi/id/product_serial']:
                if os.path.exists(path):
                    try:
                        with open(path, 'r') as f:
                            serial = f.read().strip()
                            if serial and serial.lower() != "to be filled by o.e.m.":
                                return serial
                    except:
                        pass
                        
    except Exception as e:
        print(f"[WARN] Failed to get motherboard serial: {e}")
    
    return None


def get_hardware_fingerprint() -> dict:
    """
    Collect all available hardware identifiers
    Returns a dict with all identifiers we could find
    """
    return {
        "mac_address": get_mac_address(),
        "machine_uuid": get_machine_uuid(),
        "disk_serial": get_disk_serial(),
        "cpu_id": get_cpu_id(),
        "motherboard_serial": get_motherboard_serial(),
        "machine_name": platform.node(),
        "os": platform.system(),
        "os_version": platform.version(),
        "processor": platform.processor(),
    }


def get_hardware_id() -> str:
    """
    Generate a stable hardware identifier from multiple sources.
    
    This creates a fingerprint that is extremely hard to bypass:
    - Combines multiple hardware IDs
    - Even if one changes, the others provide stability
    - Survives app reinstallation, OS reinstallation, etc.
    """
    fingerprint = get_hardware_fingerprint()
    
    # Collect all non-None identifiers
    identifiers: List[str] = []
    
    # Priority order - most reliable first
    priority_keys = [
        "machine_uuid",       # Very stable, hard to change
        "mac_address",        # Stable unless NIC changed
        "motherboard_serial", # Hardware-level
        "disk_serial",        # Hardware-level
        "cpu_id",             # Hardware-level
    ]
    
    for key in priority_keys:
        value = fingerprint.get(key)
        if value:
            identifiers.append(f"{key}:{value}")
    
    # If we have at least 2 strong identifiers, use them
    if len(identifiers) >= 2:
        combined = "|".join(identifiers)
        hardware_hash = hashlib.sha256(combined.encode()).hexdigest()
        return hardware_hash[:32]
    
    # Fallback: Use any available identifier + machine info
    if identifiers:
        # Add machine info as backup
        machine_info = f"{fingerprint['machine_name']}:{fingerprint['os']}:{fingerprint['processor']}"
        identifiers.append(machine_info)
        combined = "|".join(identifiers)
        hardware_hash = hashlib.sha256(combined.encode()).hexdigest()
        return f"PARTIAL-{hardware_hash[:24]}"
    
    # Last resort: Use only machine info
    machine = fingerprint["machine_name"]
    system = fingerprint["os"]
    processor = fingerprint["processor"]
    os_version = fingerprint["os_version"]
    
    fallback_str = f"{machine}:{system}:{processor}:{os_version}"
    fallback_hash = hashlib.sha256(fallback_str.encode()).hexdigest()
    
    print(f"[WARN] Using fallback hardware ID (hardware identifiers not available)")
    return f"FALLBACK-{fallback_hash[:24]}"


def get_device_uuid(db_connection) -> str:
    """
    Get or create device UUID from local database
    This UUID can change if user deletes app data, but hardware_id stays the same
    """
    import sqlite3

    cursor = db_connection.cursor()

    # Get existing UUID
    cursor.execute("SELECT device_uuid FROM device_info LIMIT 1")
    row = cursor.fetchone()

    if row:
        return row[0]

    # Generate new UUID
    device_uuid = str(uuid.uuid4())
    
    # Get hardware ID for storage
    hardware_id = get_hardware_id()

    # Store it with hardware_id (required by schema)
    cursor.execute(
        "INSERT INTO device_info (device_uuid, hardware_id, device_name, registered_at) VALUES (?, ?, ?, datetime('now'))",
        (device_uuid, hardware_id, platform.node())
    )
    db_connection.commit()

    return device_uuid


def get_device_identifiers(db_connection=None) -> Tuple[str, str]:
    """
    Get both device identifiers:
    - device_uuid: Can change if app is deleted/reinstalled
    - hardware_id: Permanent, based on hardware fingerprint

    Uses in-memory cache to avoid SQLite access on every request.
    This prevents "database is locked" errors.

    Returns: (device_uuid, hardware_id)
    """
    global _cached_device_uuid, _cached_hardware_id
    
    # Return from cache if available
    if _cached_device_uuid and _cached_hardware_id:
        return _cached_device_uuid, _cached_hardware_id
    
    # Hardware ID doesn't need database - calculate and cache
    if not _cached_hardware_id:
        _cached_hardware_id = get_hardware_id()
    
    # Device UUID needs database - read and cache
    if not _cached_device_uuid and db_connection:
        try:
            _cached_device_uuid = get_device_uuid(db_connection)
        except Exception as e:
            print(f"[WARN] Failed to get device_uuid from DB: {e}")
            # Generate temporary UUID if DB is unavailable
            _cached_device_uuid = f"temp-{str(uuid.uuid4())[:8]}"
    elif not _cached_device_uuid:
        # No DB connection provided - use temporary UUID
        _cached_device_uuid = f"temp-{str(uuid.uuid4())[:8]}"
    
    return _cached_device_uuid, _cached_hardware_id


def init_device_identifiers(db_connection) -> Tuple[str, str]:
    """
    Initialize device identifiers at startup.
    Call this once when the app starts to populate the cache.
    
    Returns: (device_uuid, hardware_id)
    """
    global _cached_device_uuid, _cached_hardware_id
    
    # Calculate hardware ID (no DB needed)
    _cached_hardware_id = get_hardware_id()
    
    # Get device UUID from database
    _cached_device_uuid = get_device_uuid(db_connection)
    
    print(f"[INFO] Device identifiers initialized:")
    print(f"  - device_uuid: {_cached_device_uuid}")
    print(f"  - hardware_id: {_cached_hardware_id[:16]}...")
    
    return _cached_device_uuid, _cached_hardware_id


def clear_device_cache():
    """Clear the device identifier cache (for testing)"""
    global _cached_device_uuid, _cached_hardware_id
    _cached_device_uuid = None
    _cached_hardware_id = None


def _get_app_version() -> str:
    """Read app version from frontend package.json"""
    try:
        # Get the directory of this file (desktop/backend/)
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up to desktop/ then into frontend/
        package_json_path = os.path.join(backend_dir, '..', 'frontend', 'package.json')

        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
            return package_data.get('version', '0.0.0')
    except:
        return '0.0.0'


def get_device_info() -> dict:
    """Get device information for registration"""
    return {
        "device_name": platform.node(),
        "os": platform.system().lower(),  # darwin, windows, linux
        "app_version": _get_app_version(),
    }
